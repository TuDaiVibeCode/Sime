import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Prisma 7 config. The connection URL lives here (no longer in schema.prisma)
// for the Migrate/CLI; the runtime client uses the @prisma/adapter-pg adapter
// in src/lib/prisma.ts.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
