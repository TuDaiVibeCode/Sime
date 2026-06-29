import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';

interface Schemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Validates request parts with zod. On failure forwards the ZodError to the
 * central error handler (-> 400). Only `body` is reassigned with the parsed
 * (coerced) value; query/params are validated in place to avoid mutating
 * Express getters.
 */
export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, _res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) schemas.query.parse(req.query);
      if (schemas.params) schemas.params.parse(req.params);
      next();
    } catch (err) {
      next(err);
    }
  };
