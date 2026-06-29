import { Router } from 'express';
import { checkDb } from '../lib/db';
import { checkRedis } from '../lib/redis';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const [db, redis] = await Promise.allSettled([checkDb(), checkRedis()]);
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      dependencies: {
        database: db.status === 'fulfilled' ? db.value : { configured: true, ok: false },
        redis: redis.status === 'fulfilled' ? redis.value : { configured: true, ok: false },
      },
    });
  } catch {
    res.status(503).json({
      status: 'degraded',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      dependencies: { database: { configured: true, ok: false } },
    });
  }
});

export default router;
