import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, UserProfile } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'dockworldwide_super_secure_jwt_secret_key_2026';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user';
  approval_status: 'pending' | 'approved' | 'rejected' | 'suspended';
}

export interface DownloadTokenPayload {
  fileId: string;
  userId: string;
  purpose: 'download';
}

export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
}

// Generate JWT for session
export function generateToken(user: UserProfile): string {
  const payload: AuthTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    approval_status: user.approval_status,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Generate short-lived signed download token (valid 60 seconds)
export function generateDownloadToken(fileId: string, userId: string): string {
  const payload: DownloadTokenPayload = {
    fileId,
    userId,
    purpose: 'download',
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '60s' });
}

// Verify download token
export function verifyDownloadToken(token: string): DownloadTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DownloadTokenPayload;
    if (decoded.purpose === 'download' && decoded.fileId && decoded.userId) {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

// Rate Limiter
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxAttempts) {
    return false;
  }

  entry.count += 1;
  return true;
}

// Authentication middleware
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.dock_auth_token;
  const token = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null) || cookieToken;

  if (!token) {
    req.user = undefined;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    const user = db.findUserById(decoded.userId);
    if (!user) {
      req.user = undefined;
      return next();
    }
    req.user = user;
    next();
  } catch {
    req.user = undefined;
    next();
  }
}

// Require valid authenticated user
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  next();
}

// Require approved user (or admin)
export function requireApprovedUser(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }

  // Admins are always authorized
  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.approval_status === 'pending') {
    res.status(403).json({
      error: 'Your account is waiting for admin approval.',
      code: 'ACCOUNT_PENDING',
      status: req.user.approval_status,
    });
    return;
  }

  if (req.user.approval_status === 'rejected') {
    res.status(403).json({
      error: 'Your account access request has been rejected.',
      code: 'ACCOUNT_REJECTED',
      status: req.user.approval_status,
    });
    return;
  }

  if (req.user.approval_status === 'suspended') {
    res.status(403).json({
      error: 'Your account access has been suspended by an administrator.',
      code: 'ACCOUNT_SUSPENDED',
      status: req.user.approval_status,
    });
    return;
  }

  if (req.user.approval_status !== 'approved') {
    res.status(403).json({
      error: 'Access denied. Account is not approved.',
      code: 'ACCOUNT_UNAUTHORIZED',
      status: req.user.approval_status,
    });
    return;
  }

  next();
}

// Require admin role
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Admin authentication required.' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    return;
  }

  next();
}
