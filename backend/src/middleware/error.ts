import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';
import { isProd } from '../config/env';
import { DEFAULT_LOCALE, translateMessage } from '../lib/i18n';

/** Throw this for expected, client-facing failures. */
export class HttpError extends Error {
  statusCode: number;
  details?: unknown;
  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'HttpError';
  }
}

export const notFound: RequestHandler = (req, res) => {
  const locale = req.locale ?? DEFAULT_LOCALE;
  res.status(404).json({ error: translateMessage('Not found', locale) });
};

// 4-arg signature is required for Express to treat this as an error handler.
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const locale = req.locale ?? DEFAULT_LOCALE;
  if (err instanceof ZodError) {
    res.status(400).json({
      error: translateMessage('Validation failed', locale),
      issues: err.flatten(),
    });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      error: translateMessage(err.message, locale),
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  // Never leak internals (stack, messages) to clients in production.
  res.status(500).json({
    error: isProd
      ? translateMessage('Internal server error', locale)
      : String((err as Error)?.message ?? err),
  });
};
