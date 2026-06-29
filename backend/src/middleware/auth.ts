import type { RequestHandler } from 'express';
import { HttpError } from './error';
import { verifySessionToken, SESSION_COOKIE } from '../lib/session';
import { findUserById } from '../repositories/users';

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const payload = verifySessionToken(req.cookies?.[SESSION_COOKIE]);
    if (!payload) {
      next(new HttpError(401, 'Authentication required.'));
      return;
    }

    const user = await findUserById(payload.sub);
    if (!user) {
      next(new HttpError(401, 'Authentication required.'));
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };
    next();
  } catch (err) {
    next(err);
  }
};
