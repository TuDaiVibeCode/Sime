import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

type ProgressRow = {
  id: string;
  lessonId: string | null;
  status: string;
  score: Prisma.Decimal | null;
  analysisSummary: Prisma.JsonValue;
  createdAt: Date;
};

const toProgress = (row: ProgressRow) => ({
  id: row.id,
  lessonId: row.lessonId,
  status: row.status as 'started' | 'completed' | 'skipped',
  score: row.score === null ? null : Number(row.score),
  analysisSummary: row.analysisSummary,
  createdAt: row.createdAt,
});

const progressSelect = {
  id: true,
  lessonId: true,
  status: true,
  score: true,
  analysisSummary: true,
  createdAt: true,
} as const;

export async function listProgress(userId: string) {
  const rows = await prisma.progressLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: progressSelect,
  });
  return rows.map(toProgress);
}

export async function createProgress(input: {
  userId: string;
  lessonId?: string;
  status: 'started' | 'completed' | 'skipped';
  score?: number;
  analysisSummary?: unknown;
}) {
  const row = await prisma.progressLog.create({
    data: {
      userId: input.userId,
      lessonId: input.lessonId ?? null,
      status: input.status,
      score: input.score ?? null,
      analysisSummary: (input.analysisSummary ?? {}) as Prisma.InputJsonValue,
    },
    select: progressSelect,
  });
  return toProgress(row);
}
