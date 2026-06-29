import { Router } from 'express';
import { z } from 'zod';
import {
  coachingPayloadSchema,
  healthAnalysisSchema,
  rangeAnalysisSchema,
  techniqueAnalysisSchema,
  transpositionSchema,
} from '../schemas/vocal';
import { validate } from '../middleware/validate';
import { HttpError } from '../middleware/error';
import { requireAuth } from '../middleware/auth';
import { isDbConfigured } from '../lib/db';
import {
  createAnalysisJob,
  findAnalysisJobForUser,
  type AnalysisJobType,
} from '../repositories/analysisJobs';
import { dispatchAnalysisJob } from '../lib/redis';
import { generateCoaching } from '../services/llmCoach';
import {
  analyzeRange,
  analyzeTechnique,
  analyzeVocalHealth,
  buildCoachingPayload,
  calculateTransposition,
} from '../services/vocalAnalysis';

const router = Router();
const MAX_JOB_AUDIO_BASE64_CHARS = 768 * 1024;

const base64AudioSchema = z
  .string()
  .min(1)
  .max(MAX_JOB_AUDIO_BASE64_CHARS)
  .regex(/^[A-Za-z0-9+/]+={0,2}$/, 'audioBase64 must be standard base64 PCM16.');

const jobCommonShape = {
  lessonId: z.string().trim().min(1).max(64).optional(),
  audioFileUrl: z.string().url().max(2048).optional(),
};

const audioPayloadSchema = z
  .object({
    ...jobCommonShape,
    exerciseName: z.string().trim().min(1).max(120).optional(),
    sampleRate: z.number().int().min(8_000).max(48_000),
    audioBase64: base64AudioSchema,
    model: z.enum(['swiftf0', 'rmvpe', 'crepe']).optional(),
    thresholds: z
      .object({
        maxJitterPct: z.number().finite().min(0).max(20).optional(),
        maxShimmerPct: z.number().finite().min(0).max(50).optional(),
        minHnrDb: z.number().finite().min(-20).max(80).optional(),
        minCppsDb: z.number().finite().min(0).max(40).optional(),
        minPitchStability: z.number().finite().min(0).max(100).optional(),
        minLevelStability: z.number().finite().min(0).max(100).optional(),
      })
      .optional(),
  })
  .strict();

const pitchJobPayloadSchema = z
  .object({
    ...jobCommonShape,
    exerciseName: z.string().trim().min(1).max(120).optional(),
    sampleRate: z.number().int().min(8_000).max(48_000).optional(),
    frameCount: z.number().int().min(128).max(1_000_000).optional(),
    audioBase64: base64AudioSchema.optional(),
    model: z.enum(['swiftf0', 'rmvpe', 'crepe']).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.audioBase64 && !value.sampleRate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sampleRate'],
        message: 'sampleRate is required when audioBase64 is supplied.',
      });
    }
  });

const healthJobPayloadSchema = z.union([
  healthAnalysisSchema.extend(jobCommonShape).strict(),
  audioPayloadSchema,
]);

const techniqueAudioPayloadSchema = audioPayloadSchema.omit({ thresholds: true });
const techniqueF0PayloadSchema = techniqueAnalysisSchema
  .extend({
    ...jobCommonShape,
    f0Array: z.array(z.number().finite().min(20).max(5000).nullable()).min(1).max(12_000),
    f0FrameRateHz: z.number().finite().min(1).max(500).optional(),
  })
  .strict();
const techniqueJobPayloadSchema = z.union([
  techniqueAnalysisSchema.extend(jobCommonShape).strict(),
  techniqueAudioPayloadSchema,
  techniqueF0PayloadSchema,
]);

const jobSchema = z.union([
  z.object({
    jobType: z.enum(['swiftf0', 'rmvpe', 'crepe']),
    requestPayload: pitchJobPayloadSchema,
  }),
  z.object({ jobType: z.literal('range'), requestPayload: rangeAnalysisSchema }),
  z.object({ jobType: z.literal('transposition'), requestPayload: transpositionSchema }),
  z.object({ jobType: z.literal('coach_payload'), requestPayload: coachingPayloadSchema }),
  z.object({ jobType: z.literal('health'), requestPayload: healthJobPayloadSchema }),
  z.object({ jobType: z.literal('technique'), requestPayload: techniqueJobPayloadSchema }),
]);

function ensureDbReady() {
  if (!isDbConfigured) {
    throw new HttpError(503, 'Database is not configured. Set DATABASE_URL first.');
  }
}

router.post('/range', validate({ body: rangeAnalysisSchema }), (req, res, next) => {
  const result = analyzeRange(req.body);
  if (!result) {
    next(new HttpError(422, 'Not enough stable notes to determine a safe vocal range.'));
    return;
  }
  res.json({ range: result });
});

router.post('/transpose', validate({ body: transpositionSchema }), (req, res) => {
  res.json({ transposition: calculateTransposition(req.body) });
});

router.post('/health', validate({ body: healthAnalysisSchema }), (req, res) => {
  res.json({ health: analyzeVocalHealth(req.body) });
});

router.post('/technique', validate({ body: techniqueAnalysisSchema }), (req, res) => {
  res.json({ technique: analyzeTechnique(req.body) });
});

router.post('/coach-payload', validate({ body: coachingPayloadSchema }), (req, res) => {
  res.json({ coaching: buildCoachingPayload(req.body) });
});

router.post('/coach', requireAuth, validate({ body: coachingPayloadSchema }), async (req, res, next) => {
  try {
    const text = await generateCoaching(req.body);
    res.json({ coaching: { text } });
  } catch (err) {
    next(err);
  }
});

router.post('/jobs', requireAuth, validate({ body: jobSchema }), async (req, res, next) => {
  try {
    ensureDbReady();
    const job = await createAnalysisJob({
      userId: req.user!.id,
      jobType: req.body.jobType as AnalysisJobType,
      requestPayload: req.body.requestPayload,
    });
    const dispatch = await dispatchAnalysisJob(job);
    res.status(202).json({ job, dispatch });
  } catch (err) {
    next(err);
  }
});

router.get(
  '/jobs/:id',
  requireAuth,
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res, next) => {
    try {
      ensureDbReady();
      const job = await findAnalysisJobForUser(req.params.id, req.user!.id);
      if (!job) {
        res.status(404).json({ error: 'Analysis job not found' });
        return;
      }
      res.json({ job });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/models', (_req, res) => {
  res.json({
    realtimeDefault: 'SwiftF0',
    musicBackedVocals: 'RMVPE',
    offlineDeepAnalysis: 'CREPE',
    healthValidation: 'Jitter < 1%, shimmer <= 5%, HNR >= 15 dB, CPPS tracked for warm-up health.',
    techniqueValidation: 'Pitch <= +/-50 cents, voice breaks = 0, vibrato 5-7 Hz and +/-30-50 cents, singer formant 2.4-3.0 kHz >= -20 dBFS.',
    clientPreview: 'Autocorrelation or MPM in browser',
    workerBridge: {
      queue: 'sime:analysis:jobs',
      channel: 'sime:analysis:jobs:new',
      pattern: 'Postgres stores job state; Redis carries work notifications to Python workers.',
    },
    liveAnalysis: {
      websocketPath: '/ws/live-analysis',
      queue: 'sime:live-analysis:frames',
      channel: 'sime:live-analysis:frames:new',
      framePattern: 'Authenticated browser sessions send validated JSON audio-frame envelopes for Python workers.',
    },
  });
});

export default router;
