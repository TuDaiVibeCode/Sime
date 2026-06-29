import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { logger } from './lib/logger';
import { allowedOrigins, env } from './config/env';
import { globalLimiter } from './middleware/rateLimit';
import { notFound, errorHandler } from './middleware/error';
import { localeMiddleware } from './lib/i18n';
import routes from './routes';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  if (env.TRUST_PROXY_HOPS > 0) {
    app.set('trust proxy', env.TRUST_PROXY_HOPS);
  }

  // --- security + platform middleware ---
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'none'"],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          scriptSrc: ["'none'"],
          styleSrc: ["'none'"],
          imgSrc: ["'none'"],
          connectSrc: ["'self'"],
        },
      },
    })
  );
  app.use(
    cors({
      origin(origin, cb) {
        // No origin = same-origin or non-browser client (curl, server-to-server).
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error('Origin not allowed by CORS'));
      },
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(cookieParser());
  app.use(localeMiddleware);
  app.use(pinoHttp({ logger }));
  app.use(globalLimiter);

  // --- routes ---
  app.use(routes);

  // --- fallthrough ---
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
