import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createClient } from 'redis';

process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'silent';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.WORKER_SHARED_SECRET = process.env.WORKER_SHARED_SECRET || 'local-development-worker-secret-change-before-production';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'local-development-jwt-secret-change-before-production';

const { createApp } = await import('../dist/app.js');
const { closeDb } = await import('../dist/lib/db.js');
const { closeRedis } = await import('../dist/lib/redis.js');

function pcmSineBase64(freq = 220, sampleRate = 16000, seconds = 0.6) {
  const samples = Math.floor(sampleRate * seconds);
  const buffer = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i += 1) {
    const t = i / sampleRate;
    const value = Math.max(-1, Math.min(1, 0.25 * Math.sin(2 * Math.PI * freq * t)));
    buffer.writeInt16LE(Math.round(value * 32767), i * 2);
  }
  return buffer.toString('base64');
}

async function requestJson(url, options = {}, attempts = 2) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, options);
      const text = await response.text();
      let body = null;
      if (text) body = JSON.parse(text);
      return { response, body };
    } catch (err) {
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw lastError;
}

function runWorkerOnce(baseUrl) {
  return new Promise((resolve) => {
    const child = spawn(
      'python',
      [
        '-c',
        [
          'from worker.__main__ import handle_analysis_job',
          'from worker.io import get_redis',
          'from worker import config',
          'client = get_redis()',
          'raw = client.rpoplpush(config.ANALYSIS_QUEUE_KEY, config.ANALYSIS_PROCESSING_KEY)',
          'assert raw is not None, "analysis queue was empty"',
          'handle_analysis_job(client, raw)',
        ].join('; '),
      ],
      {
        cwd: '..',
        env: {
          ...process.env,
          BACKEND_URL: baseUrl,
          REDIS_URL: process.env.REDIS_URL,
          WORKER_SHARED_SECRET: process.env.WORKER_SHARED_SECRET,
          PYTHONUNBUFFERED: '1',
        },
      }
    );

    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
    }, 120000);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', (error) => {
      clearTimeout(timeout);
      resolve({ status: null, signal: null, error, stdout, stderr });
    });
    child.on('close', (status, signal) => {
      clearTimeout(timeout);
      resolve({ status, signal, error: null, stdout, stderr });
    });
  });
}
async function main() {
  const redis = createClient({ url: process.env.REDIS_URL });
  await redis.connect();
  await redis.flushAll();
  await redis.quit();

  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const health = await requestJson(`${baseUrl}/health`);
    assert.equal(health.response.status, 200);
    assert.equal(health.body.dependencies.redis.ok, true);

    const email = `redis-worker-${Date.now()}@example.test`;
    const register = await requestJson(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'correct-horse-battery',
        displayName: 'Redis Worker Smoke',
      }),
    });
    assert.equal(register.response.status, 201, JSON.stringify(register.body));
    const cookie = register.response.headers.get('set-cookie')?.split(';')[0];
    assert.ok(cookie);

    const job = await requestJson(`${baseUrl}/api/analysis/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        jobType: 'health',
        requestPayload: {
          lessonId: 'breath-support',
          exerciseName: 'Redis worker audio health',
          sampleRate: 16000,
          audioBase64: pcmSineBase64(),
        },
      }),
    });
    assert.equal(job.response.status, 202, JSON.stringify(job.body));
    assert.equal(job.body.dispatch.queuedInRedis, true);

    const worker = await runWorkerOnce(baseUrl);
    if (worker.stdout.trim()) console.log(worker.stdout.trim());
    if (worker.stderr.trim()) console.error(worker.stderr.trim());

    assert.equal(
      worker.status,
      0,
      JSON.stringify({
        status: worker.status,
        signal: worker.signal,
        error: worker.error?.message,
        stdout: worker.stdout,
        stderr: worker.stderr,
      })
    );

    const storedJob = await requestJson(`${baseUrl}/api/analysis/jobs/${job.body.job.id}`, {
      headers: { Cookie: cookie },
    });
    assert.equal(storedJob.response.status, 200, JSON.stringify(storedJob.body));
    assert.equal(storedJob.body.job.status, 'succeeded');
    assert.equal(storedJob.body.job.resultPayload.jobType, 'health');
    assert.ok(storedJob.body.job.resultPayload.metrics);

    const sessions = await requestJson(`${baseUrl}/api/practice-sessions`, {
      headers: { Cookie: cookie },
    });
    assert.equal(sessions.response.status, 200, JSON.stringify(sessions.body));
    const session = sessions.body.practiceSessions.find((item) => item.analysisJobId === job.body.job.id);
    assert.ok(session, 'practice session for completed analysis job was not found');
    assert.equal(session.lessonId, 'breath-support');
    assert.ok(['completed', 'needs_retry'].includes(session.status));
    assert.ok(typeof session.geminiFeedback === 'string' && session.geminiFeedback.length > 20);
    assert.equal(session.healthMetrics.length, 1);
    assert.ok(typeof session.healthMetrics[0].jitterPct === 'number' || session.healthMetrics[0].jitterPct === null);

    console.log('redis worker smoke ok');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await Promise.all([closeRedis(), closeDb()]);
  }
}

await main();

