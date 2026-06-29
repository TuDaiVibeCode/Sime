'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Microphone, Stop, WarningCircle, ArrowClockwise, Waveform } from '@phosphor-icons/react';
import { autoCorrelate, noteFromPitch } from '@/lib/pitchClient';
import { btnPrimary, btnLine } from './ui';

type Status = 'idle' | 'listening' | 'analyzing' | 'done' | 'denied' | 'error';
type SingerGroup = 'unknown' | 'male' | 'female';

interface RangeResult {
  lowestStableNote: string;
  highestStableNote: string;
  rangeSemitones: number;
  voiceType: string;
  voiceColor: string;
  passaggioHint: string | null;
  roadmapStage: 'beginner' | 'intermediate' | 'advanced';
  acceptedSamples: number;
  rejectedSamples: number;
}

const STAGE_LABEL: Record<RangeResult['roadmapStage'], string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export default function RangeTestPanel() {
  const [status, setStatus] = useState<Status>('idle');
  const [singerGroup, setSingerGroup] = useState<SingerGroup>('unknown');
  const [note, setNote] = useState('--');
  const [low, setLow] = useState<{ name: string; midi: number } | null>(null);
  const [high, setHigh] = useState<{ name: string; midi: number } | null>(null);
  const [held, setHeld] = useState(0);
  const [result, setResult] = useState<RangeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const holdRef = useRef<Map<string, number>>(new Map());
  const lastTickRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (ctxRef.current && ctxRef.current.state !== 'closed') void ctxRef.current.close();
    ctxRef.current = null;
  }, []);

  const reset = useCallback(() => {
    cleanup();
    holdRef.current = new Map();
    setStatus('idle');
    setNote('--');
    setLow(null);
    setHigh(null);
    setHeld(0);
    setResult(null);
    setError(null);
  }, [cleanup]);

  const start = useCallback(async () => {
    if (status === 'listening') return;
    setResult(null);
    setError(null);
    holdRef.current = new Map();
    setLow(null);
    setHigh(null);
    setHeld(0);

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
      lastTickRef.current = performance.now();
      setStatus('listening');

      const tick = () => {
        analyser.getFloatTimeDomainData(buf);
        const now = performance.now();
        const dt = now - lastTickRef.current;
        lastTickRef.current = now;

        const freq = autoCorrelate(buf, ctx.sampleRate);
        if (freq > 0) {
          const { name, midi } = noteFromPitch(freq);
          setNote(name);
          const prev = holdRef.current.get(name) ?? 0;
          holdRef.current.set(name, Math.min(prev + dt, 60_000));
          setLow((cur) => (!cur || midi < cur.midi ? { name, midi } : cur));
          setHigh((cur) => (!cur || midi > cur.midi ? { name, midi } : cur));
          let stable = 0;
          holdRef.current.forEach((ms) => {
            if (ms >= 300) stable += 1;
          });
          setHeld(stable);
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
  }, [status, cleanup]);

  const finish = useCallback(async () => {
    cleanup();
    const notes = Array.from(holdRef.current.entries())
      .filter(([, ms]) => ms >= 120)
      .slice(0, 256)
      .map(([noteName, ms]) => ({ note: noteName, durationMs: Math.max(1, Math.round(ms)), confidence: 1 }));

    if (notes.length < 2) {
      setStatus('error');
      setError('Not enough held notes yet. Glide slowly across your range and hold each end for a moment.');
      return;
    }

    setStatus('analyzing');
    try {
      const res = await fetch('/api/analysis/range', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ singerGroup, notes }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setStatus('error');
        setError(data?.error ?? 'Could not analyze your range. Try a longer glide.');
        return;
      }
      const data = (await res.json()) as { range: RangeResult };
      
      // Auto-save the voice profile
      try {
        await fetch('/api/voice-profiles', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            voiceType: data.range.voiceType,
            voiceColor: data.range.voiceColor,
            lowestNote: data.range.lowestStableNote,
            highestNote: data.range.highestStableNote,
            rangeSemitones: data.range.rangeSemitones,
            passaggioHint: data.range.passaggioHint,
            roadmapStage: data.range.roadmapStage,
            metrics: {
              acceptedSamples: data.range.acceptedSamples,
              rejectedSamples: data.range.rejectedSamples
            }
          }),
        });
      } catch (err) {
        console.warn('Could not auto-save voice profile', err);
      }

      setResult(data.range);
      setStatus('done');
    } catch {
      setStatus('error');
      setError('The analysis service is unavailable right now.');
    }
  }, [cleanup, singerGroup]);

  useEffect(() => cleanup, [cleanup]);

  return (
    <div className="mx-auto max-w-2xl">
      {status === 'done' && result ? (
        <div className="rounded-2xl border border-white/10 bg-surface p-7">
          <p className="text-xs font-semibold uppercase text-accent">Your result</p>
          <p className="mt-2 text-3xl font-extrabold">{result.voiceType}</p>
          <p className="mt-1 text-muted">{result.voiceColor}</p>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 text-sm">
            <div>
              <dt className="flex items-center gap-1.5 text-faint">
                <Waveform size={15} aria-hidden /> Range
              </dt>
              <dd className="mt-1 text-lg font-bold">
                {result.lowestStableNote} to {result.highestStableNote}
              </dd>
              <dd className="text-xs text-faint">{result.rangeSemitones} semitones</dd>
            </div>
            <div>
              <dt className="text-faint">Stage</dt>
              <dd className="mt-1 text-lg font-bold">{STAGE_LABEL[result.roadmapStage]}</dd>
            </div>
            {result.passaggioHint ? (
              <div className="col-span-2">
                <dt className="text-faint">Passaggio</dt>
                <dd className="mt-1 font-semibold">{result.passaggioHint}</dd>
              </div>
            ) : null}
          </dl>

          <p className="mt-6 rounded-xl border border-accent/25 bg-accent/[0.06] px-4 py-3 text-sm text-muted">
            This maps the range you just sang and classifies it by range. Deeper timbre analysis is
            planned, not live. Use the result to pick songs and a key that fit your voice.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={reset} className={btnPrimary}>
              <ArrowClockwise size={18} aria-hidden /> Test again
            </button>
            <button type="button" onClick={() => window.location.reload()} className={btnLine}>
              Continue to Dashboard
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-surface2 to-surface p-7">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted">I am a</span>
            {(['unknown', 'female', 'male'] as SingerGroup[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setSingerGroup(g)}
                disabled={status === 'listening' || status === 'analyzing'}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition disabled:opacity-50 ${
                  singerGroup === g
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-white/15 text-muted hover:text-text'
                }`}
              >
                {g === 'unknown' ? 'not sure' : g}
              </button>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-white/10 bg-bg2 px-3 py-4">
              <p className="text-xs text-faint">Lowest</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{low?.name ?? '--'}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-bg2 px-3 py-4">
              <p className="text-xs text-faint">Now</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-accent">{note}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-bg2 px-3 py-4">
              <p className="text-xs text-faint">Highest</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{high?.name ?? '--'}</p>
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-faint">
            {status === 'listening'
              ? `Held notes: ${held}. Glide low, then high, holding each end.`
              : 'Start from a comfortable note. Glide down to your lowest, then up to your highest. Hold each end for a second.'}
          </p>

          <div className="mt-6 flex justify-center">
            {status === 'listening' ? (
              <button type="button" onClick={finish} className={btnPrimary}>
                <Stop size={18} aria-hidden /> Finish and analyze
              </button>
            ) : (
              <button
                type="button"
                onClick={start}
                className={btnPrimary}
                disabled={status === 'analyzing'}
              >
                <Microphone size={18} aria-hidden />
                {status === 'analyzing' ? 'Analyzing' : 'Allow microphone and start'}
              </button>
            )}
          </div>
        </div>
      )}

      {status === 'denied' ? (
        <p className="mt-4 flex items-start gap-2 text-sm text-muted">
          <WarningCircle size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />
          Microphone access was blocked. Enable it for this site in your browser settings, then try again.
        </p>
      ) : null}
      {status === 'error' && error ? (
        <p className="mt-4 flex items-start gap-2 text-sm text-muted">
          <WarningCircle size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />
          {error}
        </p>
      ) : null}

      <p className="mt-6 text-center text-sm text-faint">
        Audio is analyzed for pitch only and is not recorded or uploaded.
      </p>
    </div>
  );
}
