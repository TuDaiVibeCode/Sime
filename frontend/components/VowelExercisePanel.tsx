'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Stop, WarningCircle, ArrowClockwise } from '@phosphor-icons/react';
import { autoCorrelate, noteFromPitch, midiToFreq, midiToName } from '@/lib/pitchClient';
import { btnPrimary, btnLine } from './ui';

const ORDER = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A'];
const ROOT_OPTIONS: string[] = [];
for (let octave = 3; octave <= 4; octave++) for (const n of ORDER) ROOT_OPTIONS.push(`${n}${octave}`);

const VOWELS = [
  { label: 'ee', hint: 'bright, forward (Italian i)' },
  { label: 'eh', hint: 'open-mid (e)' },
  { label: 'ah', hint: 'open, relaxed jaw (a)' },
  { label: 'oh', hint: 'rounded (o)' },
  { label: 'oo', hint: 'closed, tall (u)' },
];

// Major scale 1-2-3-4-5-4-3-2-1 as semitone offsets.
const OFFSETS = [0, 2, 4, 5, 7, 5, 4, 2, 0];
const STEP_MS = 950;
const TONE_MS = 260;

type Status = 'idle' | 'running' | 'done' | 'denied' | 'error';
interface StepResult {
  note: string;
  cents: number | null;
}

function noteToMidi(note: string): number {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(note)!;
  const map: Record<string, number> = {
    C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
  };
  return (parseInt(m[3], 10) + 1) * 12 + map[`${m[1]}${m[2] ?? ''}`];
}

export default function VowelExercisePanel() {
  const [status, setStatus] = useState<Status>('idle');
  const [vowel, setVowel] = useState(VOWELS[2]);
  const [root, setRoot] = useState('A3');
  const [stepIndex, setStepIndex] = useState(-1);
  const [results, setResults] = useState<StepResult[]>([]);
  const [live, setLive] = useState('--');

  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const timersRef = useRef<number[]>([]);
  const capturingRef = useRef(false);
  const bufferRef = useRef<number[]>([]);
  const rootMidiRef = useRef(57);

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  const cleanup = useCallback(() => {
    clearTimers();
    cancelAnimationFrame(rafRef.current);
    capturingRef.current = false;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (ctxRef.current && ctxRef.current.state !== 'closed') void ctxRef.current.close();
    ctxRef.current = null;
  }, []);

  const playTone = useCallback((freq: number, ms: number) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.03);
    gain.gain.setValueAtTime(0.18, t0 + ms / 1000 - 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + ms / 1000);
  }, []);

  const playStep = useCallback(
    (i: number) => {
      if (i >= OFFSETS.length) {
        cleanup();
        setStatus('done');
        setStepIndex(-1);
        return;
      }
      setStepIndex(i);
      const targetMidi = rootMidiRef.current + OFFSETS[i];
      playTone(midiToFreq(targetMidi), TONE_MS);
      capturingRef.current = false;
      bufferRef.current = [];

      // After the guide tone stops, capture the sung pitch (less tone bleed).
      timersRef.current.push(
        window.setTimeout(() => {
          capturingRef.current = true;
        }, TONE_MS + 90)
      );
      timersRef.current.push(
        window.setTimeout(() => {
          capturingRef.current = false;
          const samples = bufferRef.current.filter((f) => f > 0).sort((a, b) => a - b);
          let cents: number | null = null;
          if (samples.length >= 4) {
            const median = samples[Math.floor(samples.length / 2)];
            cents = Math.round((1200 * Math.log(median / midiToFreq(targetMidi))) / Math.log(2));
          }
          setResults((prev) => [...prev, { note: midiToName(targetMidi), cents }]);
          playStep(i + 1);
        }, STEP_MS)
      );
    },
    [cleanup, playTone]
  );

  const start = useCallback(async () => {
    setResults([]);
    setStepIndex(-1);
    rootMidiRef.current = noteToMidi(root);
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
      setStatus('running');

      const tick = () => {
        analyser.getFloatTimeDomainData(buf);
        const freq = autoCorrelate(buf, ctx.sampleRate);
        if (freq > 0) {
          setLive(noteFromPitch(freq).name);
          if (capturingRef.current) bufferRef.current.push(freq);
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
      playStep(0);
    } catch (err) {
      cleanup();
      const denied =
        err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      setStatus(denied ? 'denied' : 'error');
    }
  }, [root, cleanup, playStep]);

  const stop = useCallback(() => {
    cleanup();
    setStatus('idle');
    setStepIndex(-1);
    setResults([]);
    setLive('--');
  }, [cleanup]);

  useEffect(() => cleanup, [cleanup]);

  const scored = results.filter((r) => r.cents !== null) as (StepResult & { cents: number })[];
  const avgAbs = scored.length
    ? Math.round(scored.reduce((s, r) => s + Math.abs(r.cents), 0) / scored.length)
    : 0;

  return (
    <div className="mx-auto max-w-2xl">
      {status === 'idle' || status === 'denied' || status === 'error' ? (
        <div className="rounded-2xl border border-white/10 bg-surface p-7">
          <p className="text-sm font-medium text-faint">Vowel</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {VOWELS.map((v) => (
              <button
                key={v.label}
                type="button"
                onClick={() => setVowel(v)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  vowel.label === v.label
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-white/15 text-muted hover:text-text'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted">{vowel.hint}</p>

          <label className="mt-5 block">
            <span className="text-xs font-medium text-faint">Start note (scale root)</span>
            <select
              value={root}
              onChange={(e) => setRoot(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-bg2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
            >
              {ROOT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <button type="button" onClick={start} className={`${btnPrimary} mt-6`}>
            <Play size={18} weight="fill" aria-hidden /> Start the scale
          </button>
          <p className="mt-4 text-sm text-faint">
            A short tone leads each note, then you sing it on &quot;{vowel.label}&quot;. Headphones help.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-surface2 to-surface p-8 text-center">
          {status === 'running' ? (
            <>
              <p className="text-xs font-semibold uppercase text-faint">
                Sing on &quot;{vowel.label}&quot;
              </p>
              <p className="mt-3 text-5xl font-extrabold tabular-nums">
                {stepIndex >= 0 ? midiToName(rootMidiRef.current + OFFSETS[stepIndex]) : '--'}
              </p>
              <p className="mt-3 text-muted">Now: {live}</p>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase text-accent">Result</p>
              <p className="mt-2 text-3xl font-extrabold">
                {avgAbs <= 15
                  ? 'Clean and in tune.'
                  : avgAbs <= 35
                    ? 'Good. Smooth the wobble between notes.'
                    : 'Keep at it. Match each target before moving on.'}
              </p>
              <p className="mt-2 text-muted">Average error {avgAbs} cents</p>
            </>
          )}

          <div className="mt-6 flex justify-center gap-1.5">
            {OFFSETS.map((_, i) => {
              const r = results[i];
              const color =
                r && r.cents !== null
                  ? Math.abs(r.cents) <= 25
                    ? '#6FE0A6'
                    : 'var(--color-accent)'
                  : 'var(--color-faint)';
              return (
                <span
                  key={i}
                  className="h-3 w-3 rounded-full"
                  style={{
                    background: i === stepIndex && status === 'running' ? 'var(--color-accent)' : color,
                    opacity: r || (i === stepIndex && status === 'running') ? 1 : 0.3,
                  }}
                  aria-hidden
                />
              );
            })}
          </div>

          <div className="mt-7 flex justify-center">
            {status === 'running' ? (
              <button type="button" onClick={stop} className={btnLine}>
                <Stop size={18} aria-hidden /> Stop
              </button>
            ) : (
              <button type="button" onClick={start} className={btnPrimary}>
                <ArrowClockwise size={18} aria-hidden /> Run again
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

      <p className="mt-6 text-center text-sm text-faint">
        Audio is analyzed for pitch only and is not recorded or uploaded.
      </p>
    </div>
  );
}
