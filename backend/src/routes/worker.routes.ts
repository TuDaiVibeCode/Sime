import { Buffer } from 'node:buffer';
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { requireWorkerAuth } from '../middleware/workerAuth';
import { HttpError } from '../middleware/error';
import { isDbConfigured } from '../lib/db';
import { logger } from '../lib/logger';
import { updateAnalysisJobFromWorker } from '../repositories/analysisJobs';
import { finalizeSucceededAnalysisJob } from '../services/analysisCompletion';

const router = Router();
const MAX_WORKER_RESULT_BYTES = 512 * 1024;

const jobParamsSchema = z.object({
  id: z.string().uuid(),
});

function jsonSize(value: unknown) {
  return Buffer.byteLength(JSON.stringify(value), 'utf8');
}

const workerResultSchema = z
  .record(z.unknown())
  .refine((value) => jsonSize(value) <= MAX_WORKER_RESULT_BYTES, {
    message: 'resultPayload is too large.',
  });

const workerJobUpdateSchema = z
  .object({
    status: z.enum(['running', 'succeeded', 'failed']),
    resultPayload: workerResultSchema.optional(),
    errorMessage: z.string().min(1).max(1000).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.status === 'succeeded' && !value.resultPayload) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['resultPayload'],
        message: 'resultPayload is required when status is succeeded.',
      });
    }
    if (value.status === 'failed' && !value.errorMessage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['errorMessage'],
        message: 'errorMessage is required when status is failed.',
      });
    }
  });

function ensureDbReady() {
  if (!isDbConfigured) {
    throw new HttpError(503, 'Database is not configured. Set DATABASE_URL first.');
  }
}

router.patch(
  '/analysis-jobs/:id',
  requireWorkerAuth,
  validate({ params: jobParamsSchema, body: workerJobUpdateSchema }),
  async (req, res, next) => {
    try {
      ensureDbReady();
      const job = await updateAnalysisJobFromWorker({
        jobId: req.params.id,
        status: req.body.status,
        resultPayload: req.body.resultPayload,
        errorMessage: req.body.errorMessage,
      });
      if (!job) {
        res.status(404).json({ error: 'Analysis job not found' });
        return;
      }

      let practiceSession = null;
      if (job.status === 'succeeded') {
        try {
          practiceSession = await finalizeSucceededAnalysisJob(job);
        } catch (completionErr) {
          logger.warn({ err: completionErr, jobId: job.id }, 'Analysis job completed but practice-session finalization failed');
        }
      }

      res.json({ job, practiceSession });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
