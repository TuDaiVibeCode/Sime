import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { subjects, findLesson, localizeLesson, localizeSubjects } from '../data/lessons';
import { isDbConfigured } from '../lib/db';
import { getSubjectsFromDb, findLessonFromDb } from '../repositories/lessons';
import { DEFAULT_LOCALE, translateMessage } from '../lib/i18n';

const router = Router();

// GET /api/lessons - all subjects, lectures, and lessons. Public: every lesson is free.
router.get('/', async (req, res, next) => {
  try {
    const locale = req.locale ?? DEFAULT_LOCALE;
    const rows = isDbConfigured ? await getSubjectsFromDb() : subjects;
    const localized = localizeSubjects(rows, locale);
    res.json({ subjects: localized, tracks: localized });
  } catch (err) {
    next(err);
  }
});

// GET /api/lessons/:id - a single lesson.
router.get(
  '/:id',
  validate({ params: z.object({ id: z.string().min(1).max(64) }) }),
  async (req, res, next) => {
    try {
      const lesson = isDbConfigured
        ? await findLessonFromDb(req.params.id)
        : findLesson(req.params.id);
      if (!lesson) {
        res
          .status(404)
          .json({ error: translateMessage('Lesson not found', req.locale ?? DEFAULT_LOCALE) });
        return;
      }
      res.json({ lesson: localizeLesson(lesson, req.locale ?? DEFAULT_LOCALE) });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
