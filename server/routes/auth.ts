import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, UserProfile } from '../db';
import {
  generateToken,
  requireAuth,
  checkRateLimit,
  AuthenticatedRequest,
} from '../auth';

const router = Router();

// Sanitize user object for client responses (never return password_hash)
export function sanitizeUser(user: UserProfile) {
  const { password_hash, ...rest } = user;
  return rest;
}

// User Registration (Email-only)
router.post('/register', (req, res: Response): void => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Please provide a valid email address.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    res.status(400).json({ error: 'Invalid email address format.' });
    return;
  }

  // Prevent duplicate email registrations
  const existingUser = db.findUserByEmailOrUsername(cleanEmail);
  if (existingUser) {
    res.status(409).json({ error: 'An account with this email address already exists. Please sign in.' });
    return;
  }

  // Hash password if provided or assign a random secure salt hash
  const pwdToHash = password && typeof password === 'string' && password.length >= 6
    ? password
    : `dock_pwdless_${Date.now()}_${Math.random().toString(36)}`;
  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(pwdToHash, salt);

  // Create user with status 'pending'
  const newUser = db.createUser({
    email: cleanEmail,
    password_hash,
    role: 'user',
    approval_status: 'pending',
  });

  const token = generateToken(newUser);

  res.cookie('dock_auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    message: 'Your account is waiting for admin approval.',
    user: sanitizeUser(newUser),
    token,
  });
});

// Standard User & Admin Login (Supports email-only user login)
router.post('/login', (req, res: Response): void => {
  const { email, password } = req.body;
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

  if (!email) {
    res.status(400).json({ error: 'Please enter your registered email address.' });
    return;
  }

  const cleanIdentifier = String(email).trim().toLowerCase();
  const rateLimitKey = `login:${clientIp}:${cleanIdentifier}`;

  if (!checkRateLimit(rateLimitKey, 15, 15 * 60 * 1000)) {
    res.status(429).json({
      error: 'Too many failed login attempts. Please wait 15 minutes before trying again.',
    });
    return;
  }

  const user = db.findUserByEmailOrUsername(cleanIdentifier);
  if (!user) {
    res.status(404).json({ error: 'No account registered with this email. Please request access by signing up.' });
    return;
  }

  // If user is admin, enforce admin authentication via password or dedicated admin endpoint
  if (user.role === 'admin') {
    if (!password) {
      res.status(401).json({ error: 'Administrator accounts must authenticate via the Admin Portal.' });
      return;
    }
    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid administrator credentials.' });
      return;
    }
  }

  const token = generateToken(user);

  res.cookie('dock_auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  let redirectUrl = '/downloads';
  if (user.role === 'admin') {
    redirectUrl = '/admin';
  } else if (user.approval_status === 'pending') {
    redirectUrl = '/pending-approval';
  } else if (user.approval_status === 'rejected' || user.approval_status === 'suspended') {
    redirectUrl = `/access-denied?status=${user.approval_status}`;
  }

  res.json({
    message: 'Authentication successful.',
    user: sanitizeUser(user),
    token,
    redirectUrl,
  });
});

// Dedicated Admin Login Endpoint - Strictly requires administrator username and password
router.post('/admin/login', (req, res: Response): void => {
  const { username, password } = req.body || {};
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Please enter both administrator username and password.' });
    return;
  }

  const cleanUsername = String(username).trim();
  const rateLimitKey = `admin_login:${clientIp}:${cleanUsername.toLowerCase()}`;

  if (!checkRateLimit(rateLimitKey, 10, 15 * 60 * 1000)) {
    res.status(429).json({
      error: 'Too many administrative attempts. Access temporarily locked for 15 minutes.',
    });
    return;
  }

  const user = db.findUserByEmailOrUsername(cleanUsername);
  if (!user || user.role !== 'admin') {
    res.status(401).json({ error: 'Invalid administrator credentials.' });
    return;
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    res.status(401).json({ error: 'Invalid administrator credentials.' });
    return;
  }

  const token = generateToken(user);

  res.cookie('dock_auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    message: 'Admin session authenticated.',
    user: sanitizeUser(user),
    token,
    redirectUrl: '/admin',
  });
});

// Current User State & Status Check (Pollable)
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  // Refresh from DB to get the most up-to-date approval status
  const refreshedUser = db.findUserById(req.user.id);
  if (!refreshedUser) {
    res.status(404).json({ error: 'User profile no longer exists' });
    return;
  }

  res.json({
    user: sanitizeUser(refreshedUser),
  });
});

// Logout
router.post('/logout', (_req, res: Response): void => {
  res.clearCookie('dock_auth_token');
  res.json({ message: 'Logged out successfully.' });
});

export default router;
