import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'sime-backend' },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-sime-worker-token"]',
      'req.headers["set-cookie"]',
      'res.headers["set-cookie"]',
    ],
    censor: '[Redacted]',
  },
});
