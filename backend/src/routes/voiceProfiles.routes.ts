import { Router } from 'express';
import { z } from 'zod';
import { noteNameSchema } from '../schemas/vocal';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { HttpError } from '../middleware/error';
import { isDbConfigured } from '../lib/db';
import {
  createVoiceProfile,
  getLatestVoiceProfile,
  listVoiceProfiles,
} from '../repositories/voiceProfiles';
import {
  checkPgvectorReady,
  createVoiceEmbedding,
  searchVoiceEmbeddings,
} from '../repositories/voiceEmbeddings';

const router = Router();

const voiceProfileSchema = z.object({
  voiceType: z.string().trim().min(1).max(80),
  voiceColor: z.string().trim().min(1).max(120),
  lowestNote: noteNameSchema,
  highestNote: noteNameSchema,
  rangeSemitones: z.number().int().min(0).max(72),
  passaggioHint: z.string().trim().min(1).max(160).optional(),
  roadmapStage: z.enum(['beginner', 'intermediate', 'advanced']),
  metrics: z.record(z.unknown()).default({}),
});

const embeddingSchema = z.array(z.number().finite().min(-1000).max(1000)).length(1536);

const profileParamsSchema = z.object({
  id: z.string().uuid(),
});

const voiceEmbeddingSchema = z.object({
  embedding: embeddingSchema,
  embeddingKind: z
    .string()
    .trim()
    .regex(/^[a-z0-9_-]+$/)
    .max(40)
    .default('voice_profile'),
  source: z.string().trim().min(1).max(80).default('python_ai_worker'),
});

const embeddingSearchSchema = z.object({
  embedding: embeddingSchema,
  limit: z.number().int().min(1).max(10).default(5),
});

function ensureDbReady() {
  if (!isDbConfigured) {
    throw new HttpError(503, 'Database is not configured. Set DATABASE_URL first.');
  }
}

async function ensurePgvectorReady() {
  if (!(await checkPgvectorReady())) {
    throw new HttpError(503, 'pgvector is not available. Run the database migrations first.');
  }
}

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    ensureDbReady();
    res.json({ profiles: await listVoiceProfiles(req.user!.id) });
  } catch (err) {
    next(err);
  }
});

router.get('/latest', async (req, res, next) => {
  try {
    ensureDbReady();
    res.json({ profile: await getLatestVoiceProfile(req.user!.id) });
  } catch (err) {
    next(err);
  }
});

router.post('/', validate({ body: voiceProfileSchema }), async (req, res, next) => {
  try {
    ensureDbReady();
    const profile = await createVoiceProfile({
      userId: req.user!.id,
      voiceType: req.body.voiceType,
      voiceColor: req.body.voiceColor,
      lowestNote: req.body.lowestNote,
      highestNote: req.body.highestNote,
      rangeSemitones: req.body.rangeSemitones,
      passaggioHint: req.body.passaggioHint,
      roadmapStage: req.body.roadmapStage,
      metrics: req.body.metrics,
    });
    res.status(201).json({ profile });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/embeddings/search',
  validate({ body: embeddingSearchSchema }),
  async (req, res, next) => {
    try {
      ensureDbReady();
      await ensurePgvectorReady();
      const matches = await searchVoiceEmbeddings({
        userId: req.user!.id,
        embedding: req.body.embedding,
        limit: req.body.limit,
      });
      res.json({ matches });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/embeddings',
  validate({ params: profileParamsSchema, body: voiceEmbeddingSchema }),
  async (req, res, next) => {
    try {
      ensureDbReady();
      await ensurePgvectorReady();
      const embedding = await createVoiceEmbedding({
        userId: req.user!.id,
        profileId: req.params.id,
        embedding: req.body.embedding,
        embeddingKind: req.body.embeddingKind,
        source: req.body.source,
      });
      if (!embedding) {
        res.status(404).json({ error: 'Voice profile not found' });
        return;
      }
      res.status(201).json({ embedding });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
