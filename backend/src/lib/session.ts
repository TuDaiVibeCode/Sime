import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env';

export const SESSION_COOKIE = 'sime_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

interface SessionPayload {
  sub: string;
  iat: number;
  exp: number;
}

function getSecret() {
  if (!env.JWT_SECRET) throw new Error('JWT_SECRET is not configured.');
  return env.JWT_SECRET;
}

export function isSessionSigningConfigured() {
  return Boolean(env.JWT_SECRET);
}

function sign(body: string) {
  return createHmac('sha256', getSecret()).update(body).digest('base64url');
}

export function createSessionToken(userId: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: userId,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  if (!isSessionSigningConfigured()) return null;

  try {
    const [body, signature, extra] = token.split('.');
    if (!body || !signature || extra) return null;

    const expected = Buffer.from(sign(body), 'base64url');
    const actual = Buffer.from(signature, 'base64url');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.exp !== 'number' ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
