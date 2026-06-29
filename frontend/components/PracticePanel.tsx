'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Microphone, Pause, Play, Stop, WarningCircle } from '@phosphor-icons/react';
import { autoCorrelate, noteFromPitch } from '@/lib/pitchClient';
import { btnPrimary, btnLine } from './ui';

// Scrolling pitch trail: how many recent frames, and the visible note window.
const TRAIL_LEN = 180;
const MIDI_MIN = 40; // E2
const MIDI_MAX = 84; // C6
const WORKLET_CHUNK_SIZE = 4096;
const WORKER_FRAME_SIZE = 8192;
const MAX_REVIEW_SECONDS = 120;

type Status = 'idle' | 'starting' | 'listening' | 'denied' | 'error';
type LiveStatus = 'off' | 'connecting' | 'ready' | 'unauthorized' | 'error';

type WaveSurferLike = {
  destroy: () => void;
  playPause: () => Promise<void> | void;
  on: (eventName: string, callback: () => void) => () => void;
};

function getLiveWsUrl() {
  const raw = process.env.NEXT_PUBLIC_BACKEND_WS_URL;
  if (!raw) return null;
  try {
    const url = new URL('/ws/live-analysis', raw);
    if (url.protocol !== 'ws:' && url.protocol !== 'wss:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

function encodePcm16Base64(buf: Float32Array) {
  const bytes = new Uint8Array(buf.length * 2);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < buf.length; i++) {
    const sample = Math.max(-1, Math.min(1, buf[i]));
    view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function mergeFloatChunks(chunks: Float32Array[], maxSamples?: number) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const outputLength = maxSamples ? Math.min(total, maxSamples) : total;
  const output = new Float32Array(outputLength);
  let offset = 0;
  const startIndex = maxSamples && total > maxSamples ? total - maxSamples : 0;
  let consumed = 0;

  for (const chunk of chunks) {
    const nextConsumed = consumed + chunk.length;
    if (nextConsumed <= startIndex) {
      consumed = nextConsumed;
      continue;
    }

    const sliceStart = Math.max(0, startIndex - consumed);
    const available = chunk.subarray(sliceStart, Math.min(chunk.length, sliceStart + outputLength - offset));
    output.set(available, offset);
    offset += available.length;
    consumed = nextConsumed;
    if (offset >= outputLength) break;
  }

  return output;
}

function makeWavBlob(chunks: Float32Array[], sampleRate: number) {
  const samples = mergeFloatChunks(chunks, sampleRate * MAX_REVIEW_SECONDS);
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

// Tuning bar colour: green when locked in, brand accent when off. No third hue,
// to keep the single-accent rule.
function centsColor(c: number) {
  return Math.abs(c) <= 5 ? '#6FE0A6' : 'var(--color-accent)';
}

export default function PracticePanel() {
  const [status, setStatus] = useState<Status>('idle');
  const [note, setNote] = useState('--');
  const [cents, setCents] = useState<number | null>(null);
  const [level, setLevel] = useState(0);
  const [reviewBlob, setReviewBlob] = useState<Blob | null>(null);
  const [reviewReady, setReviewReady] = useState(false);
  const [reviewPlaying, setReviewPlaying] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailCanvasRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<Array<number | null>>([]);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const sequenceRef = useRef(0);
  const lastSentRef = useRef(0);
  const recordedChunksRef = useRef<Float32Array[]>([]);
  const pendingWorkerChunksRef = useRef<Float32Array[]>([]);
  const sampleRateRef = useRef(0);
  const waveContainerRef = useRef<HTMLDivElement>(null);
  const waveSurferRef = useRef<WaveSurferLike | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>('off');
  // Pitch the Python worker returns for streamed frames, secondary to the snappy
  // local browser readout. Null until the first result arrives.
  const [workerPitch, setWorkerPitch] = useState<{
    note: string | null;
    cents: number | null;
    model: string | null;
  } | null>(null);

  const buildReview = useCallback(() => {
    const sampleRate = sampleRateRef.current;
    if (!sampleRate || recordedChunksRef.current.length === 0) return;
    setReviewBlob(makeWavBlob(recordedChunksRef.current, sampleRate));
  }, []);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    workletRef.current?.disconnect();
    workletRef.current = null;
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
    setLiveStatus('off');
    setWorkerPitch(null);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (ctxRef.current && ctxRef.current.state !== 'closed') {
      void ctxRef.current.close();
    }
    ctxRef.current = null;
    pendingWorkerChunksRef.current = [];
    buildReview();
    setStatus('idle');
    setNote('--');
    setCents(null);
    setLevel(0);
  }, [buildReview]);

  const sendWorkerFrame = useCallback((ctx: AudioContext) => {
    const ws = wsRef.current;
    if (ws?.readyState !== WebSocket.OPEN) return;

    const now = performance.now();
    if (now - lastSentRef.current < 250) return;

    const queuedSamples = pendingWorkerChunksRef.current.reduce((sum, chunk) => sum + chunk.length, 0);
    if (queuedSamples < WORKER_FRAME_SIZE) return;

    const frame = mergeFloatChunks(pendingWorkerChunksRef.current, WORKER_FRAME_SIZE);
    pendingWorkerChunksRef.current = [];
    lastSentRef.current = now;
    sequenceRef.current += 1;
    ws.send(
      JSON.stringify({
        type: 'audio_frame',
        sequence: sequenceRef.current,
        sampleRate: Math.round(ctx.sampleRate),
        frameSize: frame.length,
        model: 'swiftf0',
        audioBase64: encodePcm16Base64(frame),
      })
    );
  }, []);

  const start = useCallback(async () => {
    if (status === 'starting' || status === 'listening') return;

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('error');
        return;
      }

      setStatus('starting');
      setReviewBlob(null);
      setReviewReady(false);
      setReviewPlaying(false);
      recordedChunksRef.current = [];
      pendingWorkerChunksRef.current = [];
      sequenceRef.current = 0;
      lastSentRef.current = 0;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, autoGainControl: false, noiseSuppression: false },
      });
      streamRef.current = stream;
      const liveUrl = getLiveWsUrl();
      if (liveUrl) {
        setLiveStatus('connecting');
        const ws = new WebSocket(liveUrl);
        wsRef.current = ws;
        ws.onopen = () => setLiveStatus('ready');
        ws.onerror = () => setLiveStatus('error');
        ws.onmessage = (event) => {
          if (typeof event.data !== 'string') return;
          try {
            const msg = JSON.parse(event.data) as {
              type?: string;
              note?: unknown;
              cents?: unknown;
              modelUsed?: unknown;
            };
            if (msg.type !== 'live_result') return; // ignore ready / frame_ack
            setWorkerPitch({
              note: typeof msg.note === 'string' ? msg.note : null,
              cents: typeof msg.cents === 'number' ? msg.cents : null,
              model: typeof msg.modelUsed === 'string' ? msg.modelUsed : null,
            });
          } catch {
            // not JSON we recognise; ignore
          }
        };
        ws.onclose = (event) => {
          setLiveStatus(event.code === 1008 || event.code === 1002 ? 'unauthorized' : 'off');
          setWorkerPitch(null);
          if (wsRef.current === ws) wsRef.current = null;
        };
      }
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        wsRef.current?.close();
        wsRef.current = null;
        setLiveStatus('off');
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setStatus('error');
        return;
      }
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      ctxRef.current = ctx;
      sampleRateRef.current = ctx.sampleRate;

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      if (!ctx.audioWorklet) {
        throw new Error('AudioWorklet is not supported by this browser.');
      }
      await ctx.audioWorklet.addModule('/audio-worklet/pcm-capture-processor.js');
      const worklet = new AudioWorkletNode(ctx, 'pcm-capture-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 0,
        processorOptions: { chunkSize: WORKLET_CHUNK_SIZE },
      });
      worklet.port.onmessage = (event: MessageEvent<Float32Array>) => {
        const chunk = event.data instanceof Float32Array ? event.data : new Float32Array(event.data);
        recordedChunksRef.current.push(chunk);
        const maxChunks = Math.ceil((MAX_REVIEW_SECONDS * ctx.sampleRate) / WORKLET_CHUNK_SIZE);
        if (recordedChunksRef.current.length > maxChunks) {
          recordedChunksRef.current.splice(0, recordedChunksRef.current.length - maxChunks);
        }
        pendingWorkerChunksRef.current.push(chunk);
        sendWorkerFrame(ctx);
      };
      source.connect(worklet);
      workletRef.current = worklet;

      const buf = new Float32Array(analyser.fftSize);
      const canvas = canvasRef.current;
      const c2d = canvas?.getContext('2d') ?? null;
      const trailCanvas = trailCanvasRef.current;
      const t2d = trailCanvas?.getContext('2d') ?? null;
      trailRef.current = [];
      setStatus('listening');

      const tick = () => {
        analyser.getFloatTimeDomainData(buf);

        // waveform
        if (canvas && c2d) {
          const w = canvas.width;
          const h = canvas.height;
          c2d.clearRect(0, 0, w, h);
          c2d.lineWidth = 2;
          c2d.strokeStyle = '#FFC76B';
          c2d.beginPath();
          for (let i = 0; i < buf.length; i++) {
            const x = (i / buf.length) * w;
            const y = (0.5 + buf[i] * 0.9) * h;
            i === 0 ? c2d.moveTo(x, y) : c2d.lineTo(x, y);
          }
          c2d.stroke();
        }

        let peak = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = Math.abs(buf[i]);
          if (v > peak) peak = v;
        }
        setLevel(peak);

        const freq = autoCorrelate(buf, ctx.sampleRate);
        if (freq > 0) {
          const { name, cents: c } = noteFromPitch(freq);
          setNote(name);
          setCents(c);
        }

        // scrolling pitch trail
        const rawMidi = freq > 0 ? 12 * (Math.log(freq / 440) / Math.log(2)) + 69 : null;
        const trail = trailRef.current;
        trail.push(rawMidi);
        if (trail.length > TRAIL_LEN) trail.shift();
        if (trailCanvas && t2d) {
          const w = trailCanvas.width;
          const h = trailCanvas.height;
          t2d.clearRect(0, 0, w, h);
          t2d.strokeStyle = 'rgba(255,255,255,0.06)';
          t2d.lineWidth = 1;
          for (let m = MIDI_MIN; m <= MIDI_MAX; m += 12) {
            const gy = h - ((m - MIDI_MIN) / (MIDI_MAX - MIDI_MIN)) * h;
            t2d.beginPath();
            t2d.moveTo(0, gy);
            t2d.lineTo(w, gy);
            t2d.stroke();
          }
          for (let i = 0; i < trail.length; i++) {
            const m = trail[i];
            if (m == null) continue;
            const clamped = Math.max(MIDI_MIN, Math.min(MIDI_MAX, m));
            const x = (i / (TRAIL_LEN - 1)) * w;
            const y = h - ((clamped - MIDI_MIN) / (MIDI_MAX - MIDI_MIN)) * h;
            const offCents = (m - Math.round(m)) * 100;
            t2d.fillStyle = Math.abs(offCents) <= 5 ? '#6FE0A6' : '#FFB84D';
            t2d.beginPath();
            t2d.arc(x, y, 2.2, 0, Math.PI * 2);
            t2d.fill();
          }
        }

        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (err) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      sourceRef.current?.disconnect();
      sourceRef.current = null;
      workletRef.current?.disconnect();
      workletRef.current = null;
      if (ctxRef.current && ctxRef.current.state !== 'closed') {
        void ctxRef.current.close();
      }
      ctxRef.current = null;
      wsRef.current?.close();
      wsRef.current = null;
      setLiveStatus('off');
      const denied =
        err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      setStatus(denied ? 'denied' : 'error');
    }
  }, [sendWorkerFrame, status]);

  useEffect(() => stop, [stop]);

  useEffect(() => {
    const container = waveContainerRef.current;
    if (!container || !reviewBlob) return;

    let isCancelled = false;
    waveSurferRef.current?.destroy();
    waveSurferRef.current = null;
    setReviewReady(false);
    setReviewPlaying(false);

    void import('wavesurfer.js').then(({ default: WaveSurfer }) => {
      if (isCancelled || !waveContainerRef.current) return;
      const wave = WaveSurfer.create({
        container: waveContainerRef.current,
        height: 74,
        waveColor: 'rgba(255,255,255,0.28)',
        progressColor: '#FFB84D',
        cursorColor: '#6FE0A6',
        barWidth: 2,
        barGap: 2,
        barRadius: 2,
        normalize: true,
      }) as WaveSurferLike;
      waveSurferRef.current = wave;
      wave.on('ready', () => setReviewReady(true));
      wave.on('play', () => setReviewPlaying(true));
      wave.on('pause', () => setReviewPlaying(false));
      wave.on('finish', () => setReviewPlaying(false));
      void (wave as unknown as { loadBlob: (blob: Blob) => Promise<void> }).loadBlob(reviewBlob);
    });

    return () => {
      isCancelled = true;
      waveSurferRef.current?.destroy();
      waveSurferRef.current = null;
    };
  }, [reviewBlob]);

  const tuned = cents !== null && Math.abs(cents) <= 5;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-surface2 to-surface p-6 shadow-2xl">
        <canvas
          ref={trailCanvasRef}
          width={640}
          height={170}
          className="h-[170px] w-full rounded-xl bg-black/30"
          aria-hidden
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={88}
          className="mt-3 h-[88px] w-full rounded-xl bg-black/30"
          aria-hidden
        />

        <div className="mt-5 flex items-center justify-between rounded-xl border border-white/10 bg-bg2 px-5 py-4">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold tabular-nums">{note}</span>
            <span className="text-sm tabular-nums text-muted">
              {cents === null ? 'no signal' : `${cents > 0 ? '+' : ''}${cents} cents`}
            </span>
          </div>
          <span
            aria-live="polite"
            className="flex items-center gap-2 text-sm"
            style={{ color: tuned ? '#6FE0A6' : 'var(--color-muted)' }}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: tuned ? '#6FE0A6' : 'var(--color-faint)' }}
            />
            {status === 'listening' ? (tuned ? 'In tune' : 'Listening') : 'Idle'}
          </span>
        </div>

        {cents !== null ? (
          <div className="mt-4">
            <div className="relative h-2 rounded-full bg-bg2">
              <span
                className="absolute left-1/2 top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-white/30"
                aria-hidden
              />
              <span
                className="absolute top-1/2 h-4 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all"
                style={{
                  left: `${(Math.max(-50, Math.min(50, cents)) + 50)}%`,
                  background: centsColor(cents),
                }}
                aria-hidden
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wide text-faint">
              <span>flat</span>
              <span>in tune</span>
              <span>sharp</span>
            </div>
          </div>
        ) : null}

        {status === 'listening' && level >= 0.96 ? (
          <p
            className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs"
            style={{ color: 'var(--color-accent)' }}
          >
            <WarningCircle size={14} aria-hidden />
            Too loud. Ease off or move the mic back so the signal does not clip.
          </p>
        ) : null}

        {status === 'listening' && liveStatus !== 'off' ? (
          <div className="mt-3 text-center text-xs text-faint">
            <p>Live analysis: {liveStatus}</p>
            {workerPitch ? (
              <p className="mt-1 text-muted">
                Server pitch:{' '}
                <span className="font-semibold tabular-nums text-text">
                  {workerPitch.note ?? '--'}
                </span>
                {workerPitch.cents !== null ? (
                  <span className="tabular-nums">
                    {' '}
                    {workerPitch.cents > 0 ? '+' : ''}
                    {Math.round(workerPitch.cents)} cents
                  </span>
                ) : null}
                {workerPitch.model ? ` · ${workerPitch.model}` : ''}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 flex justify-center">
          {status === 'listening' ? (
            <button type="button" onClick={stop} className={btnLine}>
              <Stop size={18} aria-hidden /> Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={start}
              className={btnPrimary}
              disabled={status === 'starting'}
            >
              <Microphone size={18} aria-hidden />
              {status === 'starting' ? 'Starting microphone' : 'Allow microphone and sing'}
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-accent">Waveform review</p>
            <p className="mt-1 text-sm text-muted">Your last take appears here after you stop, so you can replay the shape and compare it with the pitch trail.</p>
          </div>
          <button
            type="button"
            className={btnLine}
            disabled={!reviewReady}
            onClick={() => waveSurferRef.current?.playPause()}
          >
            {reviewPlaying ? <Pause size={18} aria-hidden /> : <Play size={18} aria-hidden />}
            {reviewPlaying ? 'Pause' : 'Play'}
          </button>
        </div>
        <div ref={waveContainerRef} className="mt-4 min-h-[74px] rounded-xl bg-black/25" />
        {!reviewBlob ? (
          <p className="mt-3 text-xs text-faint">No recorded take yet.</p>
        ) : !reviewReady ? (
          <p className="mt-3 text-xs text-faint">Preparing waveform...</p>
        ) : null}
      </div>

      {status === 'denied' ? (
        <p className="mt-4 flex items-start gap-2 text-sm text-muted">
          <WarningCircle size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />
          Microphone access was blocked. Enable it for this site in your browser settings, then try again.
        </p>
      ) : null}
      {status === 'error' ? (
        <p className="mt-4 flex items-start gap-2 text-sm text-muted">
          <WarningCircle size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />
          We could not start audio capture. Check that a microphone is connected and your browser supports modern microphone audio.
        </p>
      ) : null}

      <p className="mt-6 text-center text-sm text-faint">
        Browser pitch stays local. Signed-in sessions can stream short practice frames to live analysis.
      </p>
    </div>
  );
}

