import { timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';
import { env } from '../config/env';
import { HttpError } from './error';

function getWorkerToken(header: string | undefined) {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

function safeTokenEqual(candidate: string, expected: string) {
  const candidateBuffer = Buffer.from(candidate, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  if (candidateBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(candidateBuffer, expectedBuffer);
}

export const requireWorkerAuth: RequestHandler = (req, _res, next) => {
  if (!env.WORKER_SHARED_SECRET) {
    next(new HttpError(503, 'Worker authentication is not configured.'));
    return;
  }

  const token =
    getWorkerToken(req.header('Authorization')) ?? req.header('X-Sime-Worker-Token');
  if (!token || !safeTokenEqual(token, env.WORKER_SHARED_SECRET)) {
    next(new HttpError(401, 'Worker authentication required.'));
    return;
  }

  next();
};
