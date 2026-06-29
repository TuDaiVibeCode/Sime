import { Router } from 'express';
import health from './health.routes';
import auth from './auth.routes';
import lessons from './lessons.routes';
import progress from './progress.routes';
import practiceSessions from './practiceSessions.routes';
import analysis from './analysis.routes';
import voiceProfiles from './voiceProfiles.routes';
import worker from './worker.routes';

const router = Router();

router.use('/health', health);
router.use('/api/auth', auth);
router.use('/api/lessons', lessons);
router.use('/api/progress', progress);
router.use('/api/practice-sessions', practiceSessions);
router.use('/api/analysis', analysis);
router.use('/api/voice-profiles', voiceProfiles);
router.use('/api/workers', worker);

export default router;

