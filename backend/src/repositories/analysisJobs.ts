import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export type AnalysisJobType =
  | 'swiftf0'
  | 'rmvpe'
  | 'crepe'
  | 'range'
  | 'transposition'
  | 'coach_payload'
  | 'health'
  | 'technique';

export type AnalysisJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

type AnalysisJobRow = {
  id: string;
  userId: string | null;
  jobType: string;
  status: string;
  requestPayload: Prisma.JsonValue;
  resultPayload: Prisma.JsonValue | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const toJob = (row: AnalysisJobRow) => ({
  id: row.id,
  userId: row.userId,
  jobType: row.jobType as AnalysisJobType,
  status: row.status as AnalysisJobStatus,
  requestPayload: row.requestPayload,
  resultPayload: row.resultPayload,
  errorMessage: row.errorMessage,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export type AnalysisJob = ReturnType<typeof toJob>;

export async function createAnalysisJob(input: {
  userId: string;
  jobType: AnalysisJobType;
  requestPayload: unknown;
}) {
  const row = await prisma.analysisJob.create({
    data: {
      userId: input.userId,
      jobType: input.jobType,
      requestPayload: input.requestPayload as Prisma.InputJsonValue,
    },
  });
  return toJob(row);
}

export async function findAnalysisJobForUser(jobId: string, userId: string) {
  const row = await prisma.analysisJob.findFirst({
    where: { id: jobId, userId },
  });
  return row ? toJob(row) : null;
}

export async function updateAnalysisJobFromWorker(input: {
  jobId: string;
  status: Exclude<AnalysisJobStatus, 'queued'>;
  resultPayload?: unknown;
  errorMessage?: string | null;
}) {
  const resultPayload =
    input.status === 'succeeded' && input.resultPayload !== undefined
      ? (input.resultPayload as Prisma.InputJsonValue)
      : Prisma.DbNull;
  const errorMessage =
    input.status === 'failed' ? input.errorMessage ?? 'Worker failed' : null;

  try {
    const row = await prisma.analysisJob.update({
      where: { id: input.jobId },
      // updatedAt is maintained by Prisma (@updatedAt).
      data: { status: input.status, resultPayload, errorMessage },
    });
    return toJob(row);
  } catch (err) {
    // P2025 = record to update not found. Preserve the old "returns null" contract.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return null;
    }
    throw err;
  }
}
