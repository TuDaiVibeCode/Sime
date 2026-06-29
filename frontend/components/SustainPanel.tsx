'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Microphone, Stop, WarningCircle, ArrowClockwise, Timer } from '@phosphor-icons/react';
import { autoCorrelate, noteFromPitch } from '@/lib/pitchClient';
import { btnPrimary, btnLine } from './ui';

type Status = 'idle' | 'listening' | 'done' | 'denied' | 'error';

interface Result {
  seconds: number;
  steadiness: number;
  pitchSteady: number;
  levelSteady: number;
  note: string;
}

const SILENCE_END_MS = 600;

function std(xs: number[]): number {
  if (xs.length < 2) return 0;
  const mean = xs.reduce((s, x) => s + x, 0) / xs.length;
  return Math.sqrt(xs.reduce((s, x) => s + (x - mean) ** 2, 0) / xs.length);
}

function verdict(r: Result): string {
  if (r.seconds < 5) return 'Short. Build breath support and aim for a longer, even tone.';
  if (r.steadiness < 60) return 'Wavery. Steady the airflow and the pitch.';
  if (r.seconds < 12) return 'Solid. Keep extending the hold while it stays even.';
  return 'Excellent breath control. Long and steady.';
}

export default function SustainPanel() {
  const [status, setStatus] = useState<Status>('idle');
  const [note, setNote] = useState('--');
  const [seconds, setSeconds] = useState(0);
  const [best, setBest] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const firstRef = useRef<number | null>(null);
  const lastVoicedRef = useRef<number>(0);
  const centsRef = useRef<number[]>([]);
  const levelRef = useRef<number[]>([]);
  const noteCountRef = useRef<Map<string, number>>(new Map());

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (ctxRef.current && ctxRef.current.state !== 'closed') void ctxRef.current.close();
    ctxRef.current = null;
  }, []);

  const finalize = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const first = firstRef.current;
    const secs = first ? (lastVoicedRef.current - first) / 1000 : 0;
    if (secs < 0.8 || centsRef.current.length < 5) {
      cleanup();
      setStatus('idle');
      setNote('--');
      setSeconds(0);
      return;
    }
    const centsStd = std(centsRef.current);
    const levels = levelRef.current;
    const levelMean = levels.reduce((s, x) => s + x, 0) / levels.length;
    const levelCv = levelMean > 0 ? std(levels) / levelMean : 1;
    const pitchSteady = Math.max(0, Math.min(100, 100 - centsStd * 3));
    const levelSteady = Math.max(0, Math.min(100, 100 - levelCv * 120));
    const steadiness = Math.round(pitchSteady * 0.6 + levelSteady * 0.4);
    let held = '--';
    let max = 0;
    noteCountRef.current.forEach((count, name) => {
      if (count > max) {
        max = count;
        held = name;
      }
    });
    cleanup();
    setResult({
      seconds: Math.round(secs * 10) / 10,
      steadiness,
      pitchSteady: Math.round(pitchSteady),
      levelSteady: Math.round(levelSteady),
      note: held,
    });
    setStatus('done');
  }, [cleanup]);

  const start = useCallback(async () => {
    setResult(null);
    firstRef.current = null;
    lastVoicedRef.current = 0;
    centsRef.current = [];
    levelRef.current = [];
    noteCountRef.current = new Map();
    setSeconds(0);
    setBest(0);
    setNote('--');

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('error');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, autoGainControl: false, noiseSuppression: false },
      });
      streamRef.current = stream;
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        cleanup();
        setStatus('error');
        return;
      }
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      setStatus('listening');

      const tick = () => {
        analyser.getFloatTimeDomainData(buf);
        let peak = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = Math.abs(buf[i]);
          if (v > peak) peak = v;
        }
        const freq = autoCorrelate(buf, ctx.sampleRate);
        const now = performance.now();

        if (freq > 0 && peak > 0.03) {
          const { name, cents } = noteFromPitch(freq);
          setNote(name);
          if (firstRef.current === null) firstRef.current = now;
          lastVoicedRef.current = now;
          centsRef.current.push(cents);
          levelRef.current.push(peak);
          noteCountRef.current.set(name, (noteCountRef.current.get(name) ?? 0) + 1);
          const secs = (now - firstRef.current) / 1000;
          setSeconds(secs);
          setBest((b) => Math.max(b, secs));
        } else if (firstRef.current !== null && now - lastVoicedRef.current > SILENCE_END_MS) {
          finalize();
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (err) {
      cleanup();
      const denied =
        err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      setStatus(denied ? 'denied' : 'error');
    }
  }, [cleanup, finalize]);

  const stop = useCallback(() => {
    if (firstRef.current !== null) finalize();
    else {
      cleanup();
      setStatus('idle');
    }
  }, [cleanup, finalize]);

  useEffect(() => cleanup, [cleanup]);

  return (
    <div className="mx-auto max-w-2xl">
      {status === 'done' && result ? (
        <div className="rounded-2xl border border-white/10 bg-surface p-7">
          <p className="text-xs font-semibold uppercase text-accent">Result</p>
          <p className="mt-2 text-3xl font-extrabold">{verdict(result)}</p>
          <div className="mt-6 grid grid-cols-3 gap-4 text-center text-sm">
            <div className="rounded-xl border border-white/10 bg-bg2 px-3 py-4">
              <p className="text-faint">Held</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{result.seconds}s</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-bg2 px-3 py-4">
              <p className="text-faint">Steadiness</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{result.steadiness}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-bg2 px-3 py-4">
              <p className="text-faint">Note</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{result.note}</p>
            </div>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <Bar label="Pitch steadiness" value={result.pitchSteady} />
            <Bar label="Volume steadiness" value={result.levelSteady} />
          </dl>
          <button type="button" onClick={start} className={`${btnPrimary} mt-6`}>
            <ArrowClockwise size={18} aria-hidden /> Try again
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-surface2 to-surface p-8 text-center">
          <Timer size={40} className="mx-auto text-accent" aria-hidden />
          <p className="mt-4 text-6xl font-extrabold tabular-nums">{seconds.toFixed(1)}s</p>
          <p className="mt-2 text-muted">
            {status === 'listening'
              ? `Hold it steady. Now: ${note}`
              : 'Take a low breath, then sing one comfortable note and hold it as long and even as you can.'}
          </p>
          {best > 0 && status === 'listening' ? (
            <p className="mt-1 text-sm text-faint">Best this session: {best.toFixed(1)}s</p>
          ) : null}
          <div className="mt-6 flex justify-center">
            {status === 'listening' ? (
              <button type="button" onClick={stop} className={btnLine}>
                <Stop size={18} aria-hidden /> Stop
              </button>
            ) : (
              <button type="button" onClick={start} className={btnPrimary}>
                <Microphone size={18} aria-hidden /> Allow microphone and hold a note
              </button>
            )}
          </div>
        </div>
      )}

      {status === 'denied' ? (
        <p className="mt-4 flex items-start gap-2 text-sm text-muted">
          <WarningCircle size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />
          Microphone access was blocked. Enable it for this site, then try again.
        </p>
      ) : null}
      {status === 'error' ? (
        <p className="mt-4 flex items-start gap-2 text-sm text-muted">
          <WarningCircle size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />
          We could not start audio. Check your microphone and browser support.
        </p>
      ) : null}

      <p className="mt-6 text-center text-sm text-faint">
        Audio is analyzed for pitch only and is not recorded or uploaded.
      </p>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-faint">
        <span>{label}</span>
        <span className="font-semibold text-text">{value}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-bg2">
        <div className="h-full rounded-full bg-accent" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
