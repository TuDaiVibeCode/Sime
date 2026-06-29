import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import WebSocket from 'ws';
import { createApp } from '../dist/app.js';
import { closeDb } from '../dist/lib/db.js';
import { closeRedis } from '../dist/lib/redis.js';
import { attachLiveAnalysisServer } from '../dist/live/liveAnalysis.js';

after(async () => {
  await Promise.all([closeDb(), closeRedis()]);
});

function startServer() {
  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

async function startLiveServer() {
  const app = createApp();
  const httpServer = createServer(app);
  attachLiveAnalysisServer(httpServer);
  await new Promise((resolve) => httpServer.listen(0, resolve));
  const port = httpServer.address().port;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    wsUrl: `ws://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => httpServer.close(resolve)),
  };
}

function nextWsJson(ws) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for WebSocket message')), 5000);
    ws.once('message', (data) => {
      clearTimeout(timeout);
      resolve(JSON.parse(data.toString('utf8')));
    });
    ws.once('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

test('health reports service status', async () => {
  const server = startServer();
  try {
    const res = await fetch(`${server.baseUrl}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
  } finally {
    await server.close();
  }
});

test('lessons expose subjects, lectures, EduX curriculum metrics, and lesson detail context', async () => {
  const server = startServer();
  try {
    const list = await fetch(`${server.baseUrl}/api/lessons`);
    assert.equal(list.status, 200);
    const listBody = await list.json();
    assert.ok(Array.isArray(listBody.subjects));
    assert.ok(Array.isArray(listBody.tracks));

    const foundations = listBody.subjects.find((subject) => subject.id === 'foundations');
    assert.ok(foundations);
    assert.equal(foundations.lectures[0].id, 'foundations-setup');
    assert.equal(foundations.lectures[0].lessons[0].id, 'breath-support');

    const edux = listBody.subjects.find((subject) => subject.id === 'edux-vocal-coach');
    assert.ok(edux);
    assert.equal(edux.lectures.length, 6);
    assert.equal(edux.lessons.length, 24);
    assert.equal(edux.lectures[0].lessons[0].weekNumber, 1);
    assert.equal(edux.lectures[0].lessons[2].targetMetrics.maxJitterPct, 1);
    assert.equal(edux.lectures[0].lessons[2].targetMetrics.maxShimmerPct, 5);
    assert.equal(edux.lectures[1].lessons[3].targetMetrics.maxAbsDeviationCents, 50);

    const detail = await fetch(`${server.baseUrl}/api/lessons/breath-support`);
    assert.equal(detail.status, 200);
    const detailBody = await detail.json();
    assert.equal(detailBody.lesson.subjectId, 'foundations');
    assert.equal(detailBody.lesson.trackId, 'foundations');
    assert.equal(detailBody.lesson.lectureId, 'foundations-setup');
    assert.equal(detailBody.lesson.lectureTitle, 'Set up the voice');

    const graduation = await fetch(`${server.baseUrl}/api/lessons/edux-week-24-full-performance-graduation`);
    assert.equal(graduation.status, 200);
    const graduationBody = await graduation.json();
    assert.equal(graduationBody.lesson.weekNumber, 24);
    assert.equal(graduationBody.lesson.targetMetrics.maxAbsDeviationCents, 50);
    assert.equal(graduationBody.lesson.targetMetrics.minPeakHz, 2400);
    assert.equal(graduationBody.lesson.targetMetrics.maxPeakHz, 3000);
  } finally {
    await server.close();
  }
});

test('analysis range validates stable notes', async () => {
  const server = startServer();
  try {
    const res = await fetch(`${server.baseUrl}/api/analysis/range`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        singerGroup: 'male',
        notes: [
          { note: 'G2', durationMs: 600, confidence: 0.9 },
          { note: 'E4', durationMs: 700, confidence: 0.95 },
        ],
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.range.voiceType, 'Baritone');
  } finally {
    await server.close();
  }
});


test('analysis health validates acoustic thresholds', async () => {
  const server = startServer();
  try {
    const pass = await fetch(`${server.baseUrl}/api/analysis/health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exerciseName: 'Ssst',
        metrics: {
          jitterPct: 0.5,
          shimmerPct: 3.2,
          hnrDb: 18.5,
          cppsDb: 15.1,
          pitchStability: 82,
          levelStability: 78,
        },
      }),
    });
    assert.equal(pass.status, 200);
    const passBody = await pass.json();
    assert.equal(passBody.health.status, 'PASS');
    assert.equal(passBody.health.checks.jitter.status, 'pass');

    const invalid = await fetch(`${server.baseUrl}/api/analysis/health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exerciseName: 'Bad metric',
        metrics: { jitterPct: 120, shimmerPct: 1, hnrDb: 20 },
      }),
    });
    assert.equal(invalid.status, 400);
  } finally {
    await server.close();
  }
});
test('analysis technique validates curriculum thresholds', async () => {
  const server = startServer();
  try {
    const pass = await fetch(`${server.baseUrl}/api/analysis/technique`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exerciseName: 'Passaggio and vibrato',
        pitch: { deviationCents: -40 },
        passaggio: { voiceBreaks: 0 },
        vibrato: { rateHz: 6, extentCents: 40 },
        singerFormant: { peakFreqHz: 2600, peakDbfs: -18 },
      }),
    });
    assert.equal(pass.status, 200);
    const passBody = await pass.json();
    assert.equal(passBody.technique.status, 'PASS');
    assert.equal(passBody.technique.checks.pitchAccuracy.status, 'pass');
    assert.equal(passBody.technique.checks.voiceBreaks.status, 'pass');
    assert.equal(passBody.technique.checks.vibrato.status, 'pass');
    assert.equal(passBody.technique.checks.singersFormant.status, 'pass');

    const fail = await fetch(`${server.baseUrl}/api/analysis/technique`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exerciseName: 'Unstable passaggio',
        passaggio: { voiceBreaks: 3, breakNote: 'F4' },
        vibrato: { rateHz: 9, extentCents: 120 },
      }),
    });
    assert.equal(fail.status, 200);
    const failBody = await fail.json();
    assert.equal(failBody.technique.status, 'FAIL');
    assert.equal(failBody.technique.checks.voiceBreaks.status, 'fail');
    assert.equal(failBody.technique.checks.vibrato.status, 'fail');

    const invalid = await fetch(`${server.baseUrl}/api/analysis/technique`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exerciseName: 'Invalid pitch',
        pitch: { deviationCents: 2400 },
      }),
    });
    assert.equal(invalid.status, 400);
  } finally {
    await server.close();
  }
});
test('practice sessions require auth', async () => {
  const server = startServer();
  try {
    const res = await fetch(`${server.baseUrl}/api/practice-sessions`);
    assert.equal(res.status, 401);
  } finally {
    await server.close();
  }
});
test('protected routes require auth', async () => {
  const server = startServer();
  try {
    const res = await fetch(`${server.baseUrl}/api/auth/me`);
    assert.equal(res.status, 401);
  } finally {
    await server.close();
  }
});

test('auth session can create progress, voice profile, and analysis job', async (t) => {
  const server = startServer();
  try {
    const health = await fetch(`${server.baseUrl}/health`).then((res) => res.json());
    if (!health.dependencies?.database?.ok) {
      t.skip('database is not available');
      return;
    }

    const email = `smoke-${Date.now()}@example.test`;
    const register = await fetch(`${server.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'correct-horse-battery',
        displayName: 'Smoke Test',
      }),
    });
    assert.equal(register.status, 201);

    const cookie = register.headers.get('set-cookie')?.split(';')[0];
    assert.ok(cookie);

    const progress = await fetch(`${server.baseUrl}/api/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        lessonId: 'breath-support',
        status: 'completed',
        score: 91,
        analysisSummary: { source: 'smoke' },
      }),
    });
    assert.equal(progress.status, 201);

    const practiceSession = await fetch(`${server.baseUrl}/api/practice-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        lessonId: 'breath-support',
        score: 92,
        geminiFeedback: 'Keep the airflow steady and relaxed.',
        healthMetrics: [
          {
            avgPitchHz: 220,
            jitterPct: 0.5,
            shimmerPct: 3.2,
            hnrDb: 18.5,
            cppsDb: 15.1,
            pitchStability: 82,
            levelStability: 78,
            rawMetrics: { source: 'smoke' },
          },
        ],
      }),
    });
    assert.equal(practiceSession.status, 201);
    const practiceSessionBody = await practiceSession.json();
    assert.equal(practiceSessionBody.practiceSession.lessonId, 'breath-support');
    assert.equal(practiceSessionBody.practiceSession.score, 92);
    assert.equal(practiceSessionBody.practiceSession.healthMetrics.length, 1);
    assert.equal(practiceSessionBody.practiceSession.healthMetrics[0].hnrDb, 18.5);

    const invalidPracticeSession = await fetch(`${server.baseUrl}/api/practice-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        lessonId: 'breath-support',
        healthMetrics: [{ jitterPct: 120 }],
      }),
    });
    assert.equal(invalidPracticeSession.status, 400);

    const profile = await fetch(`${server.baseUrl}/api/voice-profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        voiceType: 'Baritone',
        voiceColor: 'Tho - warm, grounded, powerful',
        lowestNote: 'G2',
        highestNote: 'E4',
        rangeSemitones: 21,
        roadmapStage: 'intermediate',
      }),
    });
    assert.equal(profile.status, 201);
    const profileBody = await profile.json();
    const profileId = profileBody.profile.id;

    const embedding = Array.from({ length: 1536 }, (_, index) => (index === 0 ? 1 : 0));
    const embeddingCreate = await fetch(
      `${server.baseUrl}/api/voice-profiles/${profileId}/embeddings`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({
          embedding,
          embeddingKind: 'voice_profile',
          source: 'smoke_test',
        }),
      }
    );
    if (embeddingCreate.status === 503) {
      t.skip('pgvector is not available');
      return;
    }
    assert.equal(embeddingCreate.status, 201);

    const embeddingSearch = await fetch(
      `${server.baseUrl}/api/voice-profiles/embeddings/search`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({ embedding, limit: 1 }),
      }
    );
    assert.equal(embeddingSearch.status, 200);
    const searchBody = await embeddingSearch.json();
    assert.equal(searchBody.matches.length, 1);
    assert.equal(searchBody.matches[0].profile.id, profileId);
    assert.equal(searchBody.matches[0].similarity, 1);

    const invalidJob = await fetch(`${server.baseUrl}/api/analysis/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        jobType: 'health',
        requestPayload: {
          lessonId: 'breath-support',
          exerciseName: 'Oversized audio',
          sampleRate: 16000,
          audioBase64: 'A'.repeat(790 * 1024),
        },
      }),
    });
    assert.equal(invalidJob.status, 400);

    const job = await fetch(`${server.baseUrl}/api/analysis/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        jobType: 'health',
        requestPayload: {
          lessonId: 'breath-support',
          exerciseName: 'Ssst airflow check',
          sampleRate: 16000,
          audioBase64: Buffer.from([1, 2, 3, 4]).toString('base64'),
        },
      }),
    });
    assert.equal(job.status, 202);
    const jobBody = await job.json();
    assert.equal(jobBody.job.status, 'queued');

    const workerToken = process.env.WORKER_SHARED_SECRET;
    if (!workerToken) {
      t.skip('worker shared secret is not configured');
      return;
    }

    const unauthorizedWorkerUpdate = await fetch(
      `${server.baseUrl}/api/workers/analysis-jobs/${jobBody.job.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'running' }),
      }
    );
    assert.equal(unauthorizedWorkerUpdate.status, 401);

    const runningWorkerUpdate = await fetch(
      `${server.baseUrl}/api/workers/analysis-jobs/${jobBody.job.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${workerToken}`,
        },
        body: JSON.stringify({ status: 'running' }),
      }
    );
    assert.equal(runningWorkerUpdate.status, 200);
    const runningWorkerBody = await runningWorkerUpdate.json();
    assert.equal(runningWorkerBody.job.status, 'running');
    assert.equal(runningWorkerBody.practiceSession, null);

    const workerUpdate = await fetch(
      `${server.baseUrl}/api/workers/analysis-jobs/${jobBody.job.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${workerToken}`,
        },
        body: JSON.stringify({
          status: 'succeeded',
          resultPayload: {
            jobType: 'health',
            pitch: { medianHz: 220, modelUsed: 'swiftf0', note: 'A3', cents: 0, voiced: true },
            metrics: {
              approximate: true,
              jitterPct: 0.5,
              shimmerPct: 3.2,
              hnrDb: 18.5,
              cppsDb: 15.1,
              pitchStability: 82,
              levelStability: 78,
            },
            techniqueMetrics: {
              pitch: { deviationCents: 0 },
              passaggio: { voiceBreaks: 0 },
              vibrato: { rateHz: 6, extentCents: 40 },
              singerFormant: { peakFreqHz: 2600, peakDbfs: -18, sprDb: 5 },
            },
          },
        }),
      }
    );
    assert.equal(workerUpdate.status, 200);
    const workerBody = await workerUpdate.json();
    assert.equal(workerBody.job.status, 'succeeded');
    assert.equal(workerBody.job.resultPayload.jobType, 'health');
    assert.equal(workerBody.practiceSession.analysisJobId, jobBody.job.id);
    assert.equal(workerBody.practiceSession.lessonId, 'breath-support');
    assert.equal(workerBody.practiceSession.status, 'completed');
    assert.equal(workerBody.practiceSession.score, 100);
    assert.ok(workerBody.practiceSession.geminiFeedback.length > 20);
    assert.equal(workerBody.practiceSession.healthMetrics.length, 1);
    assert.equal(workerBody.practiceSession.healthMetrics[0].hnrDb, 18.5);
    assert.equal(workerBody.practiceSession.healthMetrics[0].voiceBreaks, 0);
    assert.equal(workerBody.practiceSession.healthMetrics[0].singerFormantPeakHz, 2600);
  } finally {
    await server.close();
  }
});

test('live analysis websocket accepts authenticated audio frames', async (t) => {
  const server = await startLiveServer();
  try {
    const health = await fetch(`${server.baseUrl}/health`).then((res) => res.json());
    if (!health.dependencies?.database?.ok) {
      t.skip('database is not available');
      return;
    }

    const register = await fetch(`${server.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `ws-${Date.now()}@example.test`,
        password: 'correct-horse-battery',
        displayName: 'WS Test',
      }),
    });
    assert.equal(register.status, 201);
    const cookie = register.headers.get('set-cookie')?.split(';')[0];
    assert.ok(cookie);

    const ws = new WebSocket(`${server.wsUrl}/ws/live-analysis`, {
      headers: { Cookie: cookie },
    });
    try {
      const ready = await nextWsJson(ws);
      assert.equal(ready.type, 'ready');

      ws.send(
        JSON.stringify({
          type: 'audio_frame',
          sequence: 1,
          sampleRate: 16000,
          frameSize: 2048,
          model: 'swiftf0',
          audioBase64: Buffer.from([1, 2, 3, 4]).toString('base64'),
        })
      );

      const ack = await nextWsJson(ws);
      assert.equal(ack.type, 'frame_ack');
      assert.equal(ack.sequence, 1);
      assert.equal(typeof ack.dispatch.queuedInRedis, 'boolean');
    } finally {
      ws.close();
    }
  } finally {
    await server.close();
  }
});






