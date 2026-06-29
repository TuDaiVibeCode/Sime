import rateLimit from 'express-rate-limit';
import { DEFAULT_LOCALE, translateMessage } from '../lib/i18n';

const windowMs = 15 * 60 * 1000;

// Broad limiter applied to every request.
export const globalLimiter = rateLimit({
  windowMs,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const locale = req.locale ?? DEFAULT_LOCALE;
    res
      .status(429)
      .json({ error: translateMessage('Too many requests, please slow down.', locale) });
  },
});

// Stricter limiter for auth endpoints (brute-force protection).
export const authLimiter = rateLimit({
  windowMs,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const locale = req.locale ?? DEFAULT_LOCALE;
    res
      .status(429)
      .json({ error: translateMessage('Too many attempts, please try again later.', locale) });
  },
});
