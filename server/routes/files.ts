import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { db, STORAGE_DIR } from '../db';
import {
  requireApprovedUser,
  generateDownloadToken,
  verifyDownloadToken,
  checkRateLimit,
  AuthenticatedRequest,
} from '../auth';

const router = Router();

// Sanitize file record for public/approved user consumption
export function sanitizeFile(f: ReturnType<typeof db.findFileById>) {
  if (!f) return null;
  return {
    id: f.id,
    title: f.title,
    description: f.description,
    original_filename: f.original_filename,
    file_type: f.file_type,
    file_size: f.file_size,
    is_password_protected: f.is_password_protected,
    download_count: f.download_count,
    created_at: f.created_at,
    updated_at: f.updated_at,
  };
}

// 1. Get all available active files for approved users
router.get('/', requireApprovedUser, (req: AuthenticatedRequest, res: Response): void => {
  const files = db.getFiles({ activeOnly: true });
  res.json({
    files: files.map(sanitizeFile),
  });
});

// 2. Get single file info
router.get('/:id', requireApprovedUser, (req: AuthenticatedRequest, res: Response): void => {
  const file = db.findFileById(req.params.id);
  if (!file || !file.is_active) {
    res.status(404).json({ error: 'Requested file not found or currently unavailable.' });
    return;
  }
  res.json({ file: sanitizeFile(file) });
});

// 3. Verify file password and generate temporary download token
router.post('/:id/verify-password', requireApprovedUser, (req: AuthenticatedRequest, res: Response): void => {
  const { password } = req.body;
  const file = db.findFileById(req.params.id);

  if (!file || !file.is_active) {
    res.status(404).json({ error: 'Requested file not found or inactive.' });
    return;
  }

  if (!file.is_password_protected) {
    // If not protected, immediately grant token
    const token = generateDownloadToken(file.id, req.user!.id);
    res.json({
      success: true,
      downloadToken: token,
      downloadUrl: `/api/files/${file.id}/download?token=${token}`,
    });
    return;
  }

  // Rate limiting on password attempts: 6 attempts per 5 minutes per user/file
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const rateLimitKey = `file_pass:${req.user!.id}:${file.id}:${clientIp}`;

  if (!checkRateLimit(rateLimitKey, 6, 5 * 60 * 1000)) {
    res.status(429).json({
      error: 'Too many password attempts for this file. Please wait 5 minutes before trying again.',
    });
    return;
  }

  if (!password || typeof password !== 'string') {
    res.status(400).json({ error: 'Please enter the file password.' });
    return;
  }

  if (!file.password_hash) {
    res.status(500).json({ error: 'File password verification error on server.' });
    return;
  }

  const isPasswordValid = bcrypt.compareSync(password, file.password_hash);
  if (!isPasswordValid) {
    res.status(401).json({ error: 'Incorrect file password. Please try again.' });
    return;
  }

  // Password correct! Generate authorized, temporary download token (60s)
  const token = generateDownloadToken(file.id, req.user!.id);

  res.json({
    success: true,
    message: 'Password verified successfully.',
    downloadToken: token,
    downloadUrl: `/api/files/${file.id}/download?token=${token}`,
  });
});

// 4. Download file endpoint
router.get('/:id/download', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const fileId = req.params.id;
  const token = req.query.token as string | undefined;

  const file = db.findFileById(fileId);
  if (!file || !file.is_active) {
    res.status(404).send('File not found or no longer available.');
    return;
  }

  let authorizedUserId: string | null = null;
  let authorizedUserEmail: string = 'authorized_user';

  // If token is provided, verify signed temporary token
  if (token) {
    const verified = verifyDownloadToken(token);
    if (!verified || verified.fileId !== fileId) {
      res.status(403).send('Download link has expired or is invalid. Please verify the file password again.');
      return;
    }

    const user = db.findUserById(verified.userId);
    if (!user || (user.role !== 'admin' && user.approval_status !== 'approved')) {
      res.status(403).send('Your account does not have active approval to download this file.');
      return;
    }

    authorizedUserId = user.id;
    authorizedUserEmail = user.email;
  } else {
    // Direct download: user must be signed in & approved
    if (!req.user || (req.user.role !== 'admin' && req.user.approval_status !== 'approved')) {
      res.status(403).send('Approval required to download files. Please log in with an approved account.');
      return;
    }

    authorizedUserId = req.user.id;
    authorizedUserEmail = req.user.email;
  }

  // Verify file existence in private storage
  const physicalPath = path.join(STORAGE_DIR, file.storage_path);
  if (!fs.existsSync(physicalPath)) {
    res.status(404).send('Physical file is missing from secure storage.');
    return;
  }

  // Record download count & activity log
  db.incrementDownloadCount(file.id);
  db.addDownloadLog({
    user_id: authorizedUserId || 'unknown',
    user_email: authorizedUserEmail,
    file_id: file.id,
    file_title: file.title,
    ip_address: req.ip || req.socket.remoteAddress || 'unknown',
  });

  // Safe filename for header
  const safeFilename = encodeURIComponent(file.original_filename);

  res.setHeader('Content-Type', file.file_type || 'application/octet-stream');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${file.original_filename}"; filename*=UTF-8''${safeFilename}`
  );
  res.setHeader('Content-Length', file.file_size);
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const fileStream = fs.createReadStream(physicalPath);
  fileStream.pipe(res);
});

export default router;
