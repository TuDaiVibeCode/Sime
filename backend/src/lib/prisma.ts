import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../config/env';

const isPlaceholderUrl = (url: string) => url.includes('CHANGE_ME');

export const isDbConfigured = Boolean(
  env.DATABASE_URL && !isPlaceholderUrl(env.DATABASE_URL)
);

function getDbSchema(url: string | undefined): string {
  if (!url) return 'public';
  try {
    const schema = new URL(url).searchParams.get('schema');
    if (!schema) return 'public';
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(schema)) {
      throw new Error('Invalid database schema name in DATABASE_URL.');
    }
    return schema;
  } catch (err) {
    if (err instanceof Error && err.message.includes('schema')) throw err;
    return 'public';
  }
}

export const databaseSchema = getDbSchema(env.DATABASE_URL);

// Prisma 7 uses a driver adapter instead of a datasource url. The pg adapter
// takes a node-postgres pool config, so we keep the same search_path behaviour
// the old pool had for non-default schemas.
const client: PrismaClient | null = isDbConfigured
  ? new PrismaClient({
      adapter: new PrismaPg({
        connectionString: env.DATABASE_URL as string,
        options: `-c search_path=${databaseSchema},public`,
        max: 10,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
      }),
    })
  : null;

// Repositories only run after routes gate on isDbConfigured, so a missing client
// is a programming error. Surface it clearly rather than crashing with "cannot
// read property of null".
export const prisma: PrismaClient =
  client ??
  (new Proxy(
    {},
    {
      get() {
        throw new Error('Database is not configured. Set DATABASE_URL in backend/.env.');
      },
    }
  ) as PrismaClient);

export async function checkDb() {
  if (!client) return { configured: false, ok: false };
  await client.$queryRaw`select 1`;
  return { configured: true, ok: true };
}

export async function closeDb() {
  await client?.$disconnect();
}
