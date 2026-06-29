import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { HttpError } from '../middleware/error';
import { isDbConfigured } from '../lib/db';
import { createPracticeSession, listPracticeSessions } from '../repositories/practiceSessions';

const router = Router();

const nullableMetric = z.number().finite().nullable().optional();

const vocalHealthMetricSchema = z.object({
  avgPitchHz: nullableMetric.refine((value) => value == null || (value >= 20 && value <= 5000), {
    message: 'avgPitchHz must be between 20 and 5000',
  }),
  jitterPct: nullableMetric.refine((value) => value == null || (value >= 0 && value <= 100), {
    message: 'jitterPct must be between 0 and 100',
  }),
  shimmerPct: nullableMetric.refine((value) => value == null || (value >= 0 && value <= 100), {
    message: 'shimmerPct must be between 0 and 100',
  }),
  hnrDb: nullableMetric.refine((value) => value == null || (value >= -20 && value <= 80), {
    message: 'hnrDb must be between -20 and 80',
  }),
  cppsDb: nullableMetric.refine((value) => value == null || (value >= 0 && value <= 40), {
    message: 'cppsDb must be between 0 and 40',
  }),
  pitchStability: nullableMetric.refine((value) => value == null || (value >= 0 && value <= 100), {
    message: 'pitchStability must be between 0 and 100',
  }),
  levelStability: nullableMetric.refine((value) => value == null || (value >= 0 && value <= 100), {
    message: 'levelStability must be between 0 and 100',
  }),
  voiceBreaks: z.number().int().min(0).max(100).nullable().optional(),
  vibratoRateHz: nullableMetric.refine((value) => value == null || (value >= 0 && value <= 20), {
    message: 'vibratoRateHz must be between 0 and 20',
  }),
  vibratoExtentCents: nullableMetric.refine((value) => value == null || (value >= 0 && value <= 300), {
    message: 'vibratoExtentCents must be between 0 and 300',
  }),
  singerFormantPeakHz: nullableMetric.refine((value) => value == null || (value >= 20 && value <= 12000), {
    message: 'singerFormantPeakHz must be between 20 and 12000',
  }),
  singerFormantPeakDbfs: nullableMetric.refine((value) => value == null || (value >= -120 && value <= 20), {
    message: 'singerFormantPeakDbfs must be between -120 and 20',
  }),
  sprDb: nullableMetric.refine((value) => value == null || (value >= -80 && value <= 80), {
    message: 'sprDb must be between -80 and 80',
  }),
  rawMetrics: z.record(z.unknown()).default({}),
});

const practiceSessionSchema = z.object({
  lessonId: z.string().trim().min(1).max(64).optional(),
  analysisJobId: z.string().uuid().optional(),
  audioFileUrl: z.string().url().max(2048).optional(),
  score: z.number().min(0).max(100).optional(),
  geminiFeedback: z.string().trim().max(4000).optional(),
  status: z.enum(['started', 'completed', 'needs_retry']).default('completed'),
  healthMetrics: z.array(vocalHealthMetricSchema).max(10).default([]),
});

function ensureDbReady() {
  if (!isDbConfigured) {
    throw new HttpError(503, 'Database is not configured. Set DATABASE_URL first.');
  }
}

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    ensureDbReady();
    res.json({ practiceSessions: await listPracticeSessions(req.user!.id) });
  } catch (err) {
    next(err);
  }
});

router.post('/', validate({ body: practiceSessionSchema }), async (req, res, next) => {
  try {
    ensureDbReady();
    const practiceSession = await createPracticeSession({
      userId: req.user!.id,
      lessonId: req.body.lessonId,
      analysisJobId: req.body.analysisJobId,
      audioFileUrl: req.body.audioFileUrl,
      score: req.body.score,
      geminiFeedback: req.body.geminiFeedback,
      status: req.body.status,
      healthMetrics: req.body.healthMetrics,
    });
    res.status(201).json({ practiceSession });
  } catch (err) {
    next(err);
  }
});

export default router;
