import { env } from '../config/env';
import { logger } from '../lib/logger';
import type { AnalysisJob } from '../repositories/analysisJobs';
import {
  upsertPracticeSessionForAnalysisJob,
  type VocalHealthMetricInput,
} from '../repositories/practiceSessions';
import { generateAcousticCoaching } from './llmCoach';
import { analyzeTechnique, analyzeVocalHealth } from './vocalAnalysis';
import { healthAnalysisSchema, techniqueAnalysisSchema } from '../schemas/vocal';

type JsonRecord = Record<string, unknown>;

type HealthResult = ReturnType<typeof analyzeVocalHealth>;
type TechniqueResult = ReturnType<typeof analyzeTechnique>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function recordAt(value: unknown, key: string): JsonRecord | undefined {
  if (!isRecord(value)) return undefined;
  const next = value[key];
  return isRecord(next) ? next : undefined;
}

function stringAt(value: unknown, key: string, max = 2048) {
  if (!isRecord(value)) return undefined;
  const next = value[key];
  return typeof next === 'string' && next.length <= max ? next : undefined;
}

function finiteNumber(value: unknown, min: number, max: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  if (value < min || value > max) return undefined;
  return value;
}

function intNumber(value: unknown, min: number, max: number) {
  const number = finiteNumber(value, min, max);
  return number === undefined ? undefined : Math.trunc(number);
}

function buildHealth(result: JsonRecord, request: JsonRecord): HealthResult | undefined {
  const metrics = recordAt(result, 'metrics');
  if (!metrics) return undefined;

  const parsed = healthAnalysisSchema.safeParse({
    exerciseName: stringAt(request, 'exerciseName', 120) ?? 'Audio health analysis',
    metrics: {
      approximate: typeof metrics.approximate === 'boolean' ? metrics.approximate : true,
      jitterPct: finiteNumber(metrics.jitterPct, 0, 100) ?? null,
      shimmerPct: finiteNumber(metrics.shimmerPct, 0, 100) ?? null,
      hnrDb: finiteNumber(metrics.hnrDb, -20, 80) ?? null,
      cppsDb: finiteNumber(metrics.cppsDb, 0, 40) ?? null,
      pitchStability: finiteNumber(metrics.pitchStability, 0, 100) ?? null,
      levelStability: finiteNumber(metrics.levelStability, 0, 100) ?? null,
    },
    thresholds: recordAt(request, 'thresholds') ?? {},
  });

  return parsed.success ? analyzeVocalHealth(parsed.data) : undefined;
}

function buildTechnique(result: JsonRecord, request: JsonRecord): TechniqueResult | undefined {
  const techniqueMetrics = recordAt(result, 'techniqueMetrics');
  if (!techniqueMetrics) return undefined;

  const parsed = techniqueAnalysisSchema.safeParse({
    exerciseName: stringAt(request, 'exerciseName', 120) ?? 'Audio technique analysis',
    ...techniqueMetrics,
  });

  return parsed.success ? analyzeTechnique(parsed.data) : undefined;
}

function compactPitch(result: JsonRecord) {
  const pitch = recordAt(result, 'pitch');
  if (!pitch) return undefined;
  return {
    modelUsed: stringAt(pitch, 'modelUsed', 40),
    note: stringAt(pitch, 'note', 16),
    cents: finiteNumber(pitch.cents, -1200, 1200) ?? null,
    medianHz: finiteNumber(pitch.medianHz, 20, 5000) ?? null,
    voiced: typeof pitch.voiced === 'boolean' ? pitch.voiced : undefined,
  };
}

function extractMetricRow(result: JsonRecord, health?: HealthResult, technique?: TechniqueResult): VocalHealthMetricInput | undefined {
  const metrics = recordAt(result, 'metrics') ?? {};
  const techniqueMetrics = recordAt(result, 'techniqueMetrics') ?? {};
  const passaggio = recordAt(techniqueMetrics, 'passaggio');
  const vibrato = recordAt(techniqueMetrics, 'vibrato');
  const singerFormant = recordAt(techniqueMetrics, 'singerFormant');
  const pitch = recordAt(result, 'pitch');

  const row: VocalHealthMetricInput = {
    avgPitchHz: finiteNumber(pitch?.medianHz, 20, 5000),
    jitterPct: finiteNumber(metrics.jitterPct, 0, 100),
    shimmerPct: finiteNumber(metrics.shimmerPct, 0, 100),
    hnrDb: finiteNumber(metrics.hnrDb, -20, 80),
    cppsDb: finiteNumber(metrics.cppsDb, 0, 40),
    pitchStability: finiteNumber(metrics.pitchStability, 0, 100),
    levelStability: finiteNumber(metrics.levelStability, 0, 100),
    voiceBreaks: intNumber(passaggio?.voiceBreaks, 0, 100),
    vibratoRateHz: finiteNumber(vibrato?.rateHz, 0, 20),
    vibratoExtentCents: finiteNumber(vibrato?.extentCents, 0, 300),
    singerFormantPeakHz: finiteNumber(singerFormant?.peakFreqHz, 20, 12000),
    singerFormantPeakDbfs: finiteNumber(singerFormant?.peakDbfs, -120, 20),
    sprDb: finiteNumber(singerFormant?.sprDb, -80, 80),
    rawMetrics: {
      jobType: stringAt(result, 'jobType', 40),
      pitch: compactPitch(result),
      healthStatus: health?.status,
      techniqueStatus: technique?.status,
    },
  };

  const hasMetric = Object.entries(row).some(([key, value]) => key !== 'rawMetrics' && value !== undefined);
  return hasMetric ? row : undefined;
}

function statusScore(status: string | undefined) {
  if (status === 'PASS') return 100;
  if (status === 'WARN') return 78;
  if (status === 'FAIL') return 55;
  return undefined;
}

function calculateScore(health?: HealthResult, technique?: TechniqueResult) {
  const values = [statusScore(health?.status), statusScore(technique?.status)].filter(
    (value): value is number => value !== undefined
  );
  if (!values.length) return undefined;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function fallbackFeedback(health?: HealthResult, technique?: TechniqueResult) {
  const statuses = [health?.status, technique?.status].filter(Boolean);
  const lead = statuses.includes('FAIL')
    ? 'This take needs a gentler reset before you move on.'
    : statuses.includes('WARN')
      ? 'This take is close, but one setup detail needs attention.'
      : 'This take is stable enough to continue.';
  const recommendation = [
    ...(health?.recommendations ?? []),
    ...(technique?.recommendations ?? []),
  ].find((item) => typeof item === 'string' && item.trim().length > 0);
  return `${lead} ${recommendation ?? 'Keep the breath low, the jaw loose, and repeat once for consistency.'}`.slice(0, 1000);
}

async function coachingFeedback(job: AnalysisJob, health?: HealthResult, technique?: TechniqueResult) {
  const request = isRecord(job.requestPayload) ? job.requestPayload : {};
  const exerciseName = stringAt(request, 'exerciseName', 120) ?? 'EduX practice';
  if (env.OPENAI_API_KEY || env.GEMINI_API_KEY) {
    try {
      const generated = await generateAcousticCoaching({
        exerciseName,
        jobType: job.jobType,
        lessonContext: stringAt(request, 'lessonId', 64),
        health,
        technique,
      });
      if (generated) return generated.slice(0, 4000);
    } catch (err) {
      logger.warn({ err, jobId: job.id }, 'LLM acoustic coaching failed; using deterministic fallback');
    }
  }
  return fallbackFeedback(health, technique);
}

export async function finalizeSucceededAnalysisJob(job: AnalysisJob) {
  if (!job.userId || !isRecord(job.resultPayload)) return null;

  const request = isRecord(job.requestPayload) ? job.requestPayload : {};
  const health = buildHealth(job.resultPayload, request);
  const technique = buildTechnique(job.resultPayload, request);
  const metric = extractMetricRow(job.resultPayload, health, technique);
  const feedback = await coachingFeedback(job, health, technique);

  return upsertPracticeSessionForAnalysisJob({
    userId: job.userId,
    lessonId: stringAt(request, 'lessonId', 64),
    analysisJobId: job.id,
    audioFileUrl: stringAt(request, 'audioFileUrl', 2048),
    score: calculateScore(health, technique),
    geminiFeedback: feedback,
    status: health?.status === 'FAIL' || technique?.status === 'FAIL' ? 'needs_retry' : 'completed',
    healthMetrics: metric ? [metric] : [],
  });
}
