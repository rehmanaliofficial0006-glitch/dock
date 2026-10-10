import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { db, STORAGE_DIR, FileRecord } from '../db';
import { requireAdmin, AuthenticatedRequest } from '../auth';
import { sanitizeUser } from './auth';

const router = Router();

// Apply requireAdmin to all admin endpoints
router.use(requireAdmin);

// Configure Multer for secure private file storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, STORAGE_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200 MB limit
  },
});

// 1. Admin Dashboard Stats
router.get('/stats', (_req, res: Response): void => {
  const stats = db.getStats();
  res.json({ stats });
});

// 2. User Management: List & Search
router.get('/users', (req: AuthenticatedRequest, res: Response): void => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
  const statusFilter = typeof req.query.status === 'string' ? req.query.status.trim() : '';

  let users = db.getProfiles().filter((u) => u.role !== 'admin');

  if (query) {
    users = users.filter((u) => u.email.toLowerCase().includes(query));
  }

  if (statusFilter && statusFilter !== 'all') {
    users = users.filter((u) => u.approval_status === statusFilter);
  }

  res.json({
    users: users.map(sanitizeUser),
  });
});

// 3. User Management: Update Status (Approve, Reject, Suspend, Pending)
router.patch('/users/:id/status', (req: AuthenticatedRequest, res: Response): void => {
  const { status } = req.body;
  const validStatuses = ['pending', 'approved', 'rejected', 'suspended'];

  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  const updatedUser = db.updateUserStatus(req.params.id, status);
  if (!updatedUser) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  res.json({
    message: `User status successfully updated to ${status}.`,
    user: sanitizeUser(updatedUser),
  });
});

// 4. User Management: Delete User
router.delete('/users/:id', (req: AuthenticatedRequest, res: Response): void => {
  const user = db.findUserById(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  if (user.role === 'admin') {
    res.status(403).json({ error: 'Administrator accounts cannot be deleted.' });
    return;
  }

  const success = db.deleteUser(req.params.id);
  if (success) {
    res.json({ message: 'User account removed successfully.' });
  } else {
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// 5. File Management: List All Files
router.get('/files', (_req, res: Response): void => {
  const files = db.getFiles();
  res.json({
    files: files.map((f) => ({
      id: f.id,
      title: f.title,
      description: f.description,
      original_filename: f.original_filename,
      file_type: f.file_type,
      file_size: f.file_size,
      is_password_protected: f.is_password_protected,
      is_active: f.is_active,
      download_count: f.download_count,
      created_at: f.created_at,
      updated_at: f.updated_at,
    })),
  });
});

// 6. File Management: Upload New File
router.post('/files/upload', upload.single('file'), (req: AuthenticatedRequest, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ error: 'Please choose a file to upload.' });
    return;
  }

  const { title, description, password, is_active } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    // Cleanup uploaded file
    fs.unlinkSync(req.file.path);
    res.status(400).json({ error: 'Please enter a title for the file.' });
    return;
  }

  let password_hash: string | null = null;
  let is_password_protected = false;

  if (password && typeof password === 'string' && password.trim().length > 0) {
    is_password_protected = true;
    password_hash = bcrypt.hashSync(password.trim(), 10);
  }

  const newFile = db.createFile({
    title: title.trim(),
    description: (description || '').trim(),
    storage_path: req.file.filename,
    original_filename: req.file.originalname,
    file_type: req.file.mimetype || 'application/octet-stream',
    file_size: req.file.size,
    is_password_protected,
    password_hash,
    is_active: is_active !== 'false' && is_active !== false,
  });

  res.status(201).json({
    message: 'File successfully uploaded and cataloged in secure storage.',
    file: {
      id: newFile.id,
      title: newFile.title,
      description: newFile.description,
      original_filename: newFile.original_filename,
      file_type: newFile.file_type,
      file_size: newFile.file_size,
      is_password_protected: newFile.is_password_protected,
      is_active: newFile.is_active,
      download_count: newFile.download_count,
      created_at: newFile.created_at,
    },
  });
});

// 7. File Management: Edit File Metadata / Password / Status
router.put('/files/:id', (req: AuthenticatedRequest, res: Response): void => {
  const file = db.findFileById(req.params.id);
  if (!file) {
    res.status(404).json({ error: 'File record not found.' });
    return;
  }

  const { title, description, password, removePassword, is_active } = req.body;

  const updates: Partial<Omit<FileRecord, 'id' | 'created_at'>> = {};

  if (title && typeof title === 'string') {
    updates.title = title.trim();
  }
  if (description !== undefined) {
    updates.description = String(description).trim();
  }
  if (is_active !== undefined) {
    updates.is_active = Boolean(is_active);
  }

  if (removePassword) {
    updates.is_password_protected = false;
    updates.password_hash = null;
  } else if (password && typeof password === 'string' && password.trim().length > 0) {
    updates.is_password_protected = true;
    updates.password_hash = bcrypt.hashSync(password.trim(), 10);
  }

  const updated = db.updateFile(req.params.id, updates);

  res.json({
    message: 'File details updated.',
    file: {
      id: updated!.id,
      title: updated!.title,
      description: updated!.description,
      original_filename: updated!.original_filename,
      file_type: updated!.file_type,
      file_size: updated!.file_size,
      is_password_protected: updated!.is_password_protected,
      is_active: updated!.is_active,
      download_count: updated!.download_count,
      updated_at: updated!.updated_at,
    },
  });
});

// 8. File Management: Replace File Binary
router.post('/files/:id/replace', upload.single('file'), (req: AuthenticatedRequest, res: Response): void => {
  const file = db.findFileById(req.params.id);
  if (!file) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(404).json({ error: 'File not found.' });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: 'Please attach a replacement file.' });
    return;
  }

  // Delete previous physical file
  const oldPath = path.join(STORAGE_DIR, file.storage_path);
  if (fs.existsSync(oldPath)) {
    try {
      fs.unlinkSync(oldPath);
    } catch (e) {
      console.error('Error removing old file version:', e);
    }
  }

  const updated = db.updateFile(req.params.id, {
    storage_path: req.file.filename,
    original_filename: req.file.originalname,
    file_type: req.file.mimetype || 'application/octet-stream',
    file_size: req.file.size,
  });

  res.json({
    message: 'File replaced with newer version.',
    file: {
      id: updated!.id,
      title: updated!.title,
      original_filename: updated!.original_filename,
      file_size: updated!.file_size,
      updated_at: updated!.updated_at,
    },
  });
});

// 9. File Management: Delete File
router.delete('/files/:id', (req: AuthenticatedRequest, res: Response): void => {
  const success = db.deleteFile(req.params.id);
  if (success) {
    res.json({ message: 'File permanently deleted from database and storage.' });
  } else {
    res.status(404).json({ error: 'File not found.' });
  }
});

// 10. Audit & Download Logs
router.get('/logs', (_req, res: Response): void => {
  const logs = db.getDownloadLogs();
  res.json({ logs });
});

export default router;
