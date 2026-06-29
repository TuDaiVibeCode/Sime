import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimit';
import { HttpError } from '../middleware/error';
import { isDbConfigured } from '../lib/db';
import { hashPassword, verifyPassword } from '../lib/password';
import { createSessionToken, isSessionSigningConfigured, SESSION_COOKIE } from '../lib/session';
import { createUser, findUserByEmail } from '../repositories/users';
import { requireAuth } from '../middleware/auth';
import { isProd } from '../config/env';

const router = Router();

const credentials = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(200),
  displayName: z.string().trim().min(1).max(80).optional(),
});

const loginCredentials = credentials.omit({ displayName: true });

function ensureDbReady() {
  if (!isDbConfigured) {
    throw new HttpError(503, 'Database is not configured. Set DATABASE_URL first.');
  }
}

function ensureAuthReady() {
  if (!isSessionSigningConfigured()) {
    throw new HttpError(503, 'Authentication is not configured. Set JWT_SECRET first.');
  }
}

function setSessionCookie(res: import('express').Response, userId: string) {
  res.cookie(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: 'strict',
    secure: isProd,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

const publicUser = (user: {
  id: string;
  email: string;
  displayName: string | null;
  role: 'learner' | 'admin';
}) => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  role: user.role,
});

router.post('/register', authLimiter, validate({ body: credentials }), async (req, res, next) => {
  try {
    ensureAuthReady();
    ensureDbReady();
    const passwordHash = await hashPassword(req.body.password);
    const user = await createUser({
      email: req.body.email,
      passwordHash,
      displayName: req.body.displayName,
    });
    setSessionCookie(res, user.id);
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    if ((err as { code?: string }).code === '23505') {
      next(new HttpError(409, 'An account with this email already exists.'));
      return;
    }
    next(err);
  }
});

router.post('/login', authLimiter, validate({ body: loginCredentials }), async (req, res, next) => {
  try {
    ensureAuthReady();
    ensureDbReady();
    const user = await findUserByEmail(req.body.email);
    const ok = await verifyPassword(req.body.password, user?.passwordHash ?? null);
    if (!user || !ok) {
      next(new HttpError(401, 'Invalid email or password.'));
      return;
    }
    setSessionCookie(res, user.id);
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: 'strict',
    secure: isProd,
    path: '/',
  });
  res.status(204).send();
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
