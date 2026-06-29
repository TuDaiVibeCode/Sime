import 'dotenv/config';
import { z } from 'zod';

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  // Comma-separated list of allowed browser origins.
  FRONTEND_ORIGIN: z.string().default('http://localhost:3000'),
  AI_SERVICE_URL: z.string().url().default('http://localhost:8000'),
  DATABASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  REDIS_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  OPENAI_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  OPENAI_MODEL: z.preprocess(emptyToUndefined, z.string().trim().min(1).default('gpt-4.1-mini')),
  OPENAI_BASE_URL: z.preprocess(emptyToUndefined, z.string().url().default('https://api.openai.com/v1')),
  OPENAI_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(60_000).default(15_000),
  OPENAI_MAX_OUTPUT_TOKENS: z.coerce.number().int().min(64).max(4096).default(512),
  GEMINI_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  GEMINI_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(60_000).default(15_000),
  WORKER_SHARED_SECRET: z.preprocess(emptyToUndefined, z.string().min(32).optional()),
  // Auth routes return 503 until this is configured.
  JWT_SECRET: z.preprocess(emptyToUndefined, z.string().min(32).optional()),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    'Invalid environment configuration:',
    parsed.error.flatten().fieldErrors
  );
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const allowedOrigins = env.FRONTEND_ORIGIN.split(',')
  .map((s) => s.trim())
  .filter(Boolean);
