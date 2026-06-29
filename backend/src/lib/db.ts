// The data layer moved to Prisma (see lib/prisma.ts). This module is kept as a
// thin re-export so routes, server bootstrap, and the health check keep their
// existing `../lib/db` imports.
export { isDbConfigured, databaseSchema, checkDb, closeDb, prisma } from './prisma';
