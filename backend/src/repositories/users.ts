import { prisma } from '../lib/prisma';

export interface DbUser {
  id: string;
  email: string;
  passwordHash: string | null;
  displayName: string | null;
  role: 'learner' | 'admin';
}

const userSelect = {
  id: true,
  email: true,
  passwordHash: true,
  displayName: true,
  role: true,
} as const;

const toUser = (row: {
  id: string;
  email: string;
  passwordHash: string | null;
  displayName: string | null;
  role: string;
}): DbUser => ({
  id: row.id,
  email: row.email,
  passwordHash: row.passwordHash,
  displayName: row.displayName,
  role: row.role === 'admin' ? 'admin' : 'learner',
});

export async function createUser(input: {
  email: string;
  passwordHash: string;
  displayName?: string;
}) {
  const row = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      displayName: input.displayName ?? null,
    },
    select: userSelect,
  });
  return toUser(row);
}

export async function findUserByEmail(email: string) {
  // Emails are stored lowercased (see createUser); the DB also has a unique
  // index on lower(email).
  const row = await prisma.user.findFirst({
    where: { email: email.toLowerCase() },
    select: userSelect,
  });
  return row ? toUser(row) : null;
}

export async function findUserById(id: string) {
  const row = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });
  return row ? toUser(row) : null;
}
