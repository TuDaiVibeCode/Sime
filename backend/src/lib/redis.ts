import { createClient, type RedisClientType } from 'redis';
import { env } from '../config/env';
import { logger } from './logger';

export const ANALYSIS_QUEUE_KEY = 'sime:analysis:jobs';
export const ANALYSIS_CHANNEL = 'sime:analysis:jobs:new';
export const LIVE_ANALYSIS_QUEUE_KEY = 'sime:live-analysis:frames';
export const LIVE_ANALYSIS_CHANNEL = 'sime:live-analysis:frames:new';
// Worker publishes per-frame pitch results here; the WS server forwards them.
export const LIVE_RESULTS_CHANNEL = 'sime:live-analysis:results';

let client: RedisClientType | null = null;

export const isRedisConfigured = Boolean(env.REDIS_URL);

async function getRedisClient() {
  if (!env.REDIS_URL) return null;
  if (!client) {
    client = createClient({
      url: env.REDIS_URL,
      socket: {
        connectTimeout: 500,
        reconnectStrategy: false,
      },
    });
    client.on('error', (err) => logger.warn({ err }, 'Redis client error'));
  }
  if (!client.isOpen) await client.connect();
  return client;
}

export async function dispatchAnalysisJob(job: {
  id: string;
  userId: string | null;
  jobType: string;
  requestPayload: unknown;
}) {
  try {
    const redis = await getRedisClient();
    if (!redis) return { queuedInRedis: false };

    const message = JSON.stringify({
      id: job.id,
      userId: job.userId,
      jobType: job.jobType,
      requestPayload: job.requestPayload,
    });

    await redis.rPush(ANALYSIS_QUEUE_KEY, message);
    await redis.publish(ANALYSIS_CHANNEL, message);
    return { queuedInRedis: true };
  } catch (err) {
    logger.warn({ err, jobId: job.id }, 'Analysis job stored but Redis dispatch failed');
    return { queuedInRedis: false };
  }
}

export async function dispatchLiveAnalysisFrame(frame: {
  sessionId: string;
  userId: string;
  sequence: number;
  sampleRate: number;
  frameSize: number;
  model: 'swiftf0' | 'rmvpe';
  audioBase64: string;
  receivedAt: string;
}) {
  try {
    const redis = await getRedisClient();
    if (!redis) return { queuedInRedis: false };

    const message = JSON.stringify(frame);
    await redis.rPush(LIVE_ANALYSIS_QUEUE_KEY, message);
    await redis.publish(LIVE_ANALYSIS_CHANNEL, message);
    return { queuedInRedis: true };
  } catch (err) {
    logger.warn(
      { err, sessionId: frame.sessionId, sequence: frame.sequence },
      'Live analysis frame dispatch failed'
    );
    return { queuedInRedis: false };
  }
}

let resultsSubscriber: RedisClientType | null = null;

/**
 * Subscribe to worker live-analysis results, invoking onResult for each raw JSON
 * message. Uses a dedicated long-lived connection (a Redis client in subscriber
 * mode cannot issue normal commands). Best effort: returns false when Redis is
 * unconfigured or the subscribe fails, so live results degrade gracefully.
 */
export async function subscribeLiveAnalysisResults(
  onResult: (raw: string) => void
): Promise<boolean> {
  if (!env.REDIS_URL) return false;
  try {
    if (!resultsSubscriber) {
      resultsSubscriber = createClient({
        url: env.REDIS_URL,
        socket: {
          connectTimeout: 500,
          // Keep this subscriber alive across brief outages, with backoff.
          reconnectStrategy: (retries) => Math.min(retries * 200, 5_000),
        },
      });
      resultsSubscriber.on('error', (err) =>
        logger.warn({ err }, 'Live results subscriber error')
      );
    }
    if (!resultsSubscriber.isOpen) await resultsSubscriber.connect();
    await resultsSubscriber.subscribe(LIVE_RESULTS_CHANNEL, onResult);
    return true;
  } catch (err) {
    logger.warn({ err }, 'Could not subscribe to live analysis results');
    return false;
  }
}

export async function checkRedis() {
  if (!env.REDIS_URL) return { configured: false, ok: false };
  const redis = await getRedisClient();
  if (!redis) return { configured: false, ok: false };
  await redis.ping();
  return { configured: true, ok: true };
}

export async function closeRedis() {
  if (client?.isOpen) await client.quit();
  client = null;
  if (resultsSubscriber?.isOpen) await resultsSubscriber.quit();
  resultsSubscriber = null;
}
