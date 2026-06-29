import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export type PracticeSessionStatus = 'started' | 'completed' | 'needs_retry';

export interface VocalHealthMetricInput {
  avgPitchHz?: number;
  jitterPct?: number;
  shimmerPct?: number;
  hnrDb?: number;
  cppsDb?: number;
  pitchStability?: number;
  levelStability?: number;
  voiceBreaks?: number;
  vibratoRateHz?: number;
  vibratoExtentCents?: number;
  singerFormantPeakHz?: number;
  singerFormantPeakDbfs?: number;
  sprDb?: number;
  rawMetrics?: unknown;
}

const metricSelect = {
  id: true,
  sessionId: true,
  avgPitchHz: true,
  jitterPct: true,
  shimmerPct: true,
  hnrDb: true,
  cppsDb: true,
  pitchStability: true,
  levelStability: true,
  voiceBreaks: true,
  vibratoRateHz: true,
  vibratoExtentCents: true,
  singerFormantPeakHz: true,
  singerFormantPeakDbfs: true,
  sprDb: true,
  rawMetrics: true,
  createdAt: true,
} as const;

const sessionSelect = {
  id: true,
  userId: true,
  lessonId: true,
  analysisJobId: true,
  audioFileUrl: true,
  score: true,
  geminiFeedback: true,
  status: true,
  createdAt: true,
  healthMetrics: {
    orderBy: { createdAt: 'desc' },
    select: metricSelect,
  },
} as const;

type MetricRow = Prisma.VocalHealthMetricGetPayload<{ select: typeof metricSelect }>;
type SessionRow = Prisma.PracticeSessionGetPayload<{ select: typeof sessionSelect }>;

function decimalToNumber(value: Prisma.Decimal | null) {
  return value === null ? null : Number(value);
}

function toMetric(row: MetricRow) {
  return {
    id: row.id,
    sessionId: row.sessionId,
    avgPitchHz: decimalToNumber(row.avgPitchHz),
    jitterPct: decimalToNumber(row.jitterPct),
    shimmerPct: decimalToNumber(row.shimmerPct),
    hnrDb: decimalToNumber(row.hnrDb),
    cppsDb: decimalToNumber(row.cppsDb),
    pitchStability: decimalToNumber(row.pitchStability),
    levelStability: decimalToNumber(row.levelStability),
    voiceBreaks: row.voiceBreaks,
    vibratoRateHz: decimalToNumber(row.vibratoRateHz),
    vibratoExtentCents: decimalToNumber(row.vibratoExtentCents),
    singerFormantPeakHz: decimalToNumber(row.singerFormantPeakHz),
    singerFormantPeakDbfs: decimalToNumber(row.singerFormantPeakDbfs),
    sprDb: decimalToNumber(row.sprDb),
    rawMetrics: row.rawMetrics,
    createdAt: row.createdAt,
  };
}

function toSession(row: SessionRow) {
  return {
    id: row.id,
    userId: row.userId,
    lessonId: row.lessonId,
    analysisJobId: row.analysisJobId,
    audioFileUrl: row.audioFileUrl,
    score: decimalToNumber(row.score),
    geminiFeedback: row.geminiFeedback,
    status: row.status as PracticeSessionStatus,
    createdAt: row.createdAt,
    healthMetrics: row.healthMetrics.map(toMetric),
  };
}

function metricCreate(metric: VocalHealthMetricInput) {
  return {
    avgPitchHz: metric.avgPitchHz ?? null,
    jitterPct: metric.jitterPct ?? null,
    shimmerPct: metric.shimmerPct ?? null,
    hnrDb: metric.hnrDb ?? null,
    cppsDb: metric.cppsDb ?? null,
    pitchStability: metric.pitchStability ?? null,
    levelStability: metric.levelStability ?? null,
    voiceBreaks: metric.voiceBreaks ?? null,
    vibratoRateHz: metric.vibratoRateHz ?? null,
    vibratoExtentCents: metric.vibratoExtentCents ?? null,
    singerFormantPeakHz: metric.singerFormantPeakHz ?? null,
    singerFormantPeakDbfs: metric.singerFormantPeakDbfs ?? null,
    sprDb: metric.sprDb ?? null,
    rawMetrics: (metric.rawMetrics ?? {}) as Prisma.InputJsonValue,
  };
}

export async function listPracticeSessions(userId: string) {
  const rows = await prisma.practiceSession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: sessionSelect,
  });
  return rows.map(toSession);
}

export async function createPracticeSession(input: {
  userId: string;
  lessonId?: string;
  analysisJobId?: string;
  audioFileUrl?: string;
  score?: number;
  geminiFeedback?: string;
  status?: PracticeSessionStatus;
  healthMetrics?: VocalHealthMetricInput[];
}) {
  const row = await prisma.practiceSession.create({
    data: {
      userId: input.userId,
      lessonId: input.lessonId ?? null,
      analysisJobId: input.analysisJobId ?? null,
      audioFileUrl: input.audioFileUrl ?? null,
      score: input.score ?? null,
      geminiFeedback: input.geminiFeedback ?? null,
      status: input.status ?? 'completed',
      healthMetrics: input.healthMetrics?.length
        ? { create: input.healthMetrics.map(metricCreate) }
        : undefined,
    },
    select: sessionSelect,
  });
  return toSession(row);
}

export async function upsertPracticeSessionForAnalysisJob(input: {
  userId: string;
  lessonId?: string;
  analysisJobId: string;
  audioFileUrl?: string;
  score?: number;
  geminiFeedback?: string;
  status?: PracticeSessionStatus;
  healthMetrics?: VocalHealthMetricInput[];
}) {
  const healthMetrics = input.healthMetrics?.map(metricCreate) ?? [];
  const row = await prisma.practiceSession.upsert({
    where: { analysisJobId: input.analysisJobId },
    create: {
      userId: input.userId,
      lessonId: input.lessonId ?? null,
      analysisJobId: input.analysisJobId,
      audioFileUrl: input.audioFileUrl ?? null,
      score: input.score ?? null,
      geminiFeedback: input.geminiFeedback ?? null,
      status: input.status ?? 'completed',
      healthMetrics: healthMetrics.length ? { create: healthMetrics } : undefined,
    },
    update: {
      lessonId: input.lessonId ?? null,
      audioFileUrl: input.audioFileUrl ?? null,
      score: input.score ?? null,
      geminiFeedback: input.geminiFeedback ?? null,
      status: input.status ?? 'completed',
      healthMetrics: {
        deleteMany: {},
        ...(healthMetrics.length ? { create: healthMetrics } : {}),
      },
    },
    select: sessionSelect,
  });
  return toSession(row);
}
