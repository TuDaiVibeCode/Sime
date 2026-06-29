import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import type { Duplex } from 'node:stream';
import type { IncomingMessage } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import { z } from 'zod';
import { SESSION_COOKIE, verifySessionToken } from '../lib/session';
import { findUserById, type DbUser } from '../repositories/users';
import { dispatchLiveAnalysisFrame, subscribeLiveAnalysisResults } from '../lib/redis';
import { logger } from '../lib/logger';

const LIVE_PATH = '/ws/live-analysis';
const MAX_MESSAGE_BYTES = 96 * 1024;
const MAX_AUDIO_BASE64_CHARS = 64 * 1024;

// Open browser sockets, keyed by the sessionId we stamp onto every frame, so a
// worker result coming back on the Redis channel can be routed to its owner.
const sessions = new Map<string, WebSocket>();

const liveFrameSchema = z.object({
  type: z.literal('audio_frame'),
  sequence: z.number().int().min(0).max(1_000_000_000),
  sampleRate: z.number().int().min(8_000).max(48_000),
  frameSize: z.number().int().min(128).max(8_192),
  model: z.enum(['swiftf0', 'rmvpe']).default('swiftf0'),
  audioBase64: z
    .string()
    .min(1)
    .max(MAX_AUDIO_BASE64_CHARS)
    .regex(/^[A-Za-z0-9+/]+={0,2}$/),
});

// What the worker publishes to sime:live-analysis:results for each live frame.
const liveResultSchema = z.object({
  type: z.literal('live_result'),
  sessionId: z.string(),
  sequence: z.number().optional(),
  note: z.string().nullable().optional(),
  cents: z.number().nullable().optional(),
  hz: z.number().nullable().optional(),
  voiced: z.boolean().optional(),
  modelUsed: z.string().nullable().optional(),
});

function parseCookies(header: string | undefined) {
  const cookies = new Map<string, string>();
  if (!header) return cookies;
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (!name) continue;
    try {
      cookies.set(name, decodeURIComponent(value));
    } catch {
      cookies.set(name, value);
    }
  }
  return cookies;
}

async function authenticate(req: IncomingMessage): Promise<DbUser | null> {
  const cookies = parseCookies(req.headers.cookie);
  const payload = verifySessionToken(cookies.get(SESSION_COOKIE));
  if (!payload) return null;
  return findUserById(payload.sub);
}

function rejectUpgrade(socket: Duplex, statusCode: 401 | 404 | 503) {
  const statusText =
    statusCode === 401 ? 'Unauthorized' : statusCode === 404 ? 'Not Found' : 'Service Unavailable';
  socket.write(`HTTP/1.1 ${statusCode} ${statusText}\r\nConnection: close\r\n\r\n`);
  socket.destroy();
}

function sendJson(ws: WebSocket, payload: unknown) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

// Forward one worker result to its browser session. Never echoes userId back.
function routeLiveResult(raw: string) {
  let result;
  try {
    result = liveResultSchema.parse(JSON.parse(raw));
  } catch {
    return; // ignore malformed worker output
  }
  const ws = sessions.get(result.sessionId);
  if (!ws) return; // session closed, or owned by another backend instance
  sendJson(ws, {
    type: 'live_result',
    sequence: result.sequence,
    note: result.note ?? null,
    cents: result.cents ?? null,
    hz: result.hz ?? null,
    voiced: result.voiced ?? false,
    modelUsed: result.modelUsed ?? null,
  });
}

function handleConnection(ws: WebSocket, user: DbUser) {
  const sessionId = randomUUID();
  sessions.set(sessionId, ws);
  const drop = () => sessions.delete(sessionId);
  ws.on('close', drop);
  ws.on('error', drop);

  sendJson(ws, {
    type: 'ready',
    sessionId,
    models: ['swiftf0', 'rmvpe'],
    maxMessageBytes: MAX_MESSAGE_BYTES,
  });

  ws.on('message', async (data) => {
    try {
      const raw = Array.isArray(data)
        ? Buffer.concat(data)
        : Buffer.isBuffer(data)
          ? data
          : Buffer.from(new Uint8Array(data));
      const byteLength = raw.byteLength;
      if (byteLength > MAX_MESSAGE_BYTES) {
        ws.close(1009, 'Message too large');
        return;
      }

      const parsed = liveFrameSchema.parse(JSON.parse(raw.toString('utf8')));
      const dispatch = await dispatchLiveAnalysisFrame({
        sessionId,
        userId: user.id,
        sequence: parsed.sequence,
        sampleRate: parsed.sampleRate,
        frameSize: parsed.frameSize,
        model: parsed.model,
        audioBase64: parsed.audioBase64,
        receivedAt: new Date().toISOString(),
      });

      sendJson(ws, {
        type: 'frame_ack',
        sequence: parsed.sequence,
        dispatch,
      });
    } catch (err) {
      logger.warn({ err, sessionId }, 'Rejected live analysis frame');
      sendJson(ws, { type: 'error', error: 'Invalid live analysis frame.' });
    }
  });
}

export function attachLiveAnalysisServer(server: Server) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_MESSAGE_BYTES });

  // Bridge worker pitch results back to the browser session that sent the frame.
  // Best effort: if Redis is down, frames still dispatch and the UI shows the
  // local browser pitch; worker results simply do not arrive.
  void subscribeLiveAnalysisResults(routeLiveResult);

  server.on('upgrade', (req, socket, head) => {
    const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
    if (pathname !== LIVE_PATH) {
      rejectUpgrade(socket, 404);
      return;
    }

    authenticate(req)
      .then((user) => {
        if (!user) {
          rejectUpgrade(socket, 401);
          return;
        }
        wss.handleUpgrade(req, socket, head, (ws) => {
          handleConnection(ws, user);
        });
      })
      .catch((err) => {
        logger.warn({ err }, 'Live analysis authentication failed');
        rejectUpgrade(socket, 503);
      });
  });

  return wss;
}
