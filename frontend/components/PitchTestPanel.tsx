'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Stop, WarningCircle, ArrowClockwise, Ear, Microphone } from '@phosphor-icons/react';
import { autoCorrelate, midiToFreq, midiToName, noteFromPitch } from '@/lib/pitchClient';
import { btnPrimary, btnLine } from './ui';

const TOTAL_ROUNDS = 8;
// A comfortable spread of target notes (C3 to A4) used for both groups.
const TARGET_POOL = [48, 50, 52, 53, 55, 57, 59, 60, 62, 64, 65, 67, 69];

type Phase = 'idle' | 'target' | 'sing' | 'feedback' | 'done' | 'denied' | 'error';

interface RoundResult {
  targetNote: string;
  sangNote: string;
  cents: number | null;
}

function freqToName(freq: number) {
  return noteFromPitch(freq).name;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function verdict(avgAbs: number) {
  if (avgAbs <= 10) return 'Excellent ear. You land notes dead on.';
  if (avgAbs <= 25) return 'Strong ear. Most notes are right on target.';
  if (avgAbs <= 50) return 'Developing. You are close; keep training the match.';
  return 'Keep practising. Hum the note first, then sing, and watch it lock in.';
}

export default function PitchTestPanel() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState<number | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [live, setLive] = useState('--');

  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const phaseRef = useRef<Phase>('idle');
  const captureRef = useRef<number[]>([]);
  const timersRef = useRef<number[]>([]);
  const orderRef = useRef<number[]>([]);
  const roundRef = useRef(0);

  const setPhaseBoth = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  const cleanup = useCallback(() => {
    clearTimers();
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (ctxRef.current && ctxRef.current.state !== 'closed') void ctxRef.current.close();
    ctxRef.current = null;
  }, []);

  const playTone = useCallback((freq: number, ms: number) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.2, ctx.currentTime + ms / 1000 - 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + ms / 1000);
  }, []);

  const runRound = useCallback(() => {
    const r = roundRef.current;
    if (r >= TOTAL_ROUNDS) {
      setPhaseBoth('done');
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const tMidi = orderRef.current[r];
    setRound(r + 1);
    setTarget(tMidi);
    setPhaseBoth('target');
    playTone(midiToFreq(tMidi), 1300);

    timersRef.current.push(
      window.setTimeout(() => {
        captureRef.current = [];
        setPhaseBoth('sing');
      }, 1500)
    );

    timersRef.current.push(
      window.setTimeout(() => {
        const samples = captureRef.current.filter((f) => f > 0).sort((a, b) => a - b);
        let cents: number | null = null;
        let sangNote = '--';
        if (samples.length >= 5) {
          const median = samples[Math.floor(samples.length / 2)];
          cents = Math.round((1200 * Math.log(median / midiToFreq(tMidi))) / Math.log(2));
          sangNote = freqToName(median);
        }
        setResults((prev) => [...prev, { targetNote: midiToName(tMidi), sangNote, cents }]);
        setPhaseBoth('feedback');
        timersRef.current.push(
          window.setTimeout(() => {
            roundRef.current = r + 1;
            runRound();
          }, 1500)
        );
      }, 4100)
    );
  }, [playTone]);

  const start = useCallback(async () => {
    setResults([]);
    setRound(0);
    roundRef.current = 0;
    orderRef.current = shuffle(TARGET_POOL).slice(0, TOTAL_ROUNDS);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setPhaseBoth('error');
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
        setPhaseBoth('error');
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

      const tick = () => {
        analyser.getFloatTimeDomainData(buf);
        const freq = autoCorrelate(buf, ctx.sampleRate);
        if (phaseRef.current === 'sing' && freq > 0) {
          captureRef.current.push(freq);
          setLive(freqToName(freq));
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
      runRound();
    } catch (err) {
      cleanup();
      const denied =
        err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      setPhaseBoth(denied ? 'denied' : 'error');
    }
  }, [cleanup, runRound]);

  const stop = useCallback(() => {
    cleanup();
    setPhaseBoth('idle');
    setRound(0);
    setTarget(null);
    setResults([]);
    setLive('--');
  }, [cleanup]);

  useEffect(() => cleanup, [cleanup]);

  const scored = results.filter((r) => r.cents !== null) as (RoundResult & { cents: number })[];
  const avgAbs = scored.length
    ? Math.round(scored.reduce((s, r) => s + Math.abs(r.cents), 0) / scored.length)
    : 0;
  const inTune = scored.filter((r) => Math.abs(r.cents) <= 25).length;

  return (
    <div className="mx-auto max-w-2xl">
      {phase === 'done' ? (
        <div className="rounded-2xl border border-white/10 bg-surface p-7">
          <p className="text-xs font-semibold uppercase text-accent">Your ear</p>
          <p className="mt-2 text-3xl font-extrabold">{verdict(avgAbs)}</p>
          <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl border border-white/10 bg-bg2 px-4 py-3">
              <p className="text-faint">Average error</p>
              <p className="mt-1 text-xl font-bold">{avgAbs} cents</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-bg2 px-4 py-3">
              <p className="text-faint">On target</p>
              <p className="mt-1 text-xl font-bold">
                {inTune} of {scored.length}
              </p>
            </div>
          </div>

          <ul className="mt-5 divide-y divide-white/10">
            {results.map((r, i) => (
              <li key={i} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span className="text-muted">
                  Target <span className="font-semibold text-text">{r.targetNote}</span>, you sang{' '}
                  <span className="font-semibold text-text">{r.sangNote}</span>
                </span>
                <span
                  className="font-semibold tabular-nums"
                  style={{
                    color:
                      r.cents === null
                        ? 'var(--color-faint)'
                        : Math.abs(r.cents) <= 25
                          ? '#6FE0A6'
                          : 'var(--color-accent)',
                  }}
                >
                  {r.cents === null ? 'no signal' : `${r.cents > 0 ? '+' : ''}${r.cents}c`}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={start} className={btnPrimary}>
              <ArrowClockwise size={18} aria-hidden /> Test again
            </button>
            <a href="/practice" className={btnLine}>
              Practise matching
            </a>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-surface2 to-surface p-7 text-center">
          {phase === 'idle' || phase === 'denied' || phase === 'error' ? (
            <>
              <Ear size={40} className="mx-auto text-accent" aria-hidden />
              <h2 className="mt-4 text-xl font-bold">Test your pitch matching</h2>
              <p className="mx-auto mt-2 max-w-md text-muted">
                Sime plays a note, you sing it back. Over {TOTAL_ROUNDS} rounds it scores how close
                your voice lands. Headphones help so the mic does not hear the tone.
              </p>
              <button type="button" onClick={start} className={`${btnPrimary} mt-6`}>
                <Microphone size={18} aria-hidden /> Allow microphone and start
              </button>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase text-faint">
                Round {round} of {TOTAL_ROUNDS}
              </p>
              <p className="mt-3 text-5xl font-extrabold tabular-nums">
                {target !== null ? midiToName(target) : '--'}
              </p>
              <p className="mt-4 text-lg font-semibold" aria-live="polite">
                {phase === 'target' ? (
                  <span className="inline-flex items-center gap-2 text-accent">
                    <Play size={18} weight="fill" aria-hidden /> Listen
                  </span>
                ) : phase === 'sing' ? (
                  <span className="inline-flex items-center gap-2 text-accent">
                    <Microphone size={18} aria-hidden /> Sing it now: {live}
                  </span>
                ) : (
                  <span className="text-muted">Nice. Next note coming.</span>
                )}
              </p>
              <button type="button" onClick={stop} className={`${btnLine} mt-6`}>
                <Stop size={18} aria-hidden /> Stop
              </button>
            </>
          )}
        </div>
      )}

      {phase === 'denied' ? (
        <p className="mt-4 flex items-start gap-2 text-sm text-muted">
          <WarningCircle size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />
          Microphone access was blocked. Enable it for this site in your browser settings, then try again.
        </p>
      ) : null}
      {phase === 'error' ? (
        <p className="mt-4 flex items-start gap-2 text-sm text-muted">
          <WarningCircle size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />
          We could not start audio. Check your microphone and that the browser supports the Web Audio API.
        </p>
      ) : null}

      <p className="mt-6 text-center text-sm text-faint">
        Audio is analyzed for pitch only and is not recorded or uploaded.
      </p>
    </div>
  );
}
