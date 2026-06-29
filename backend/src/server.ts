import { createServer } from 'node:http';
import { createApp } from './app';
import { env } from './config/env';
import { closeDb } from './lib/db';
import { closeRedis } from './lib/redis';
import { logger } from './lib/logger';
import { attachLiveAnalysisServer } from './live/liveAnalysis';

const app = createApp();
const httpServer = createServer(app);
attachLiveAnalysisServer(httpServer);

const server = httpServer.listen(env.PORT, () => {
  logger.info(
    `Sime backend listening on http://localhost:${env.PORT} (${env.NODE_ENV})`
  );
});

function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down`);
  server.close(async () => {
    await Promise.all([closeDb(), closeRedis()]);
    logger.info('HTTP server closed');
    process.exit(0);
  });
  // Safety net: force exit if connections do not drain.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});
