import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { HttpError } from '../middleware/error';
import { isDbConfigured } from '../lib/db';
import { createProgress, listProgress } from '../repositories/progress';

const router = Router();

router.use(requireAuth);

const progressInput = z.object({
  lessonId: z.string().min(1).max(64).optional(),
  status: z.enum(['started', 'completed', 'skipped']),
  score: z.number().min(0).max(100).optional(),
  analysisSummary: z.record(z.unknown()).default({}),
});

function ensureDbReady() {
  if (!isDbConfigured) {
    throw new HttpError(503, 'Database is not configured. Set DATABASE_URL first.');
  }
}

router.get('/', async (req, res, next) => {
  try {
    ensureDbReady();
    res.json({ progress: await listProgress(req.user!.id) });
  } catch (err) {
    next(err);
  }
});

router.post('/', validate({ body: progressInput }), async (req, res, next) => {
  try {
    ensureDbReady();
    const progress = await createProgress({
      userId: req.user!.id,
      lessonId: req.body.lessonId,
      status: req.body.status,
      score: req.body.score,
      analysisSummary: req.body.analysisSummary,
    });
    res.status(201).json({ progress });
  } catch (err) {
    next(err);
  }
});

export default router;
