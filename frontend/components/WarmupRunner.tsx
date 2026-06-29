'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipForward, ArrowClockwise, CheckCircle } from '@phosphor-icons/react';
import { btnPrimary, btnLine } from './ui';

interface Step {
  name: string;
  cue: string;
  seconds: number;
}

// SOVT routine from vocal_docs Stage 2: backpressure first, then open up. ~12 min.
const STEPS: Step[] = [
  {
    name: 'Humming',
    cue: 'Gentle "hmm" on major scales, up and down one octave. Keep it light and forward in the face.',
    seconds: 180,
  },
  {
    name: 'Lip trills',
    cue: 'Lip "brrr" slides from low to high and back. Keep the buzz unbroken the whole way.',
    seconds: 210,
  },
  {
    name: 'Straw phonation',
    cue: 'Hum through a thin straw or into a cup, gliding gently across your whole range.',
    seconds: 210,
  },
  {
    name: 'Open up',
    cue: 'Move the same slides onto an open "ah", keeping the easy, supported feeling.',
    seconds: 120,
  },
];

const TOTAL = STEPS.reduce((s, step) => s + step.seconds, 0);

function mmss(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function WarmupRunner() {
  const [index, setIndex] = useState(0);
  const [left, setLeft] = useState(STEPS[0].seconds);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!running || done) return;
    const id = window.setInterval(() => {
      setLeft((l) => {
        if (l > 1) return l - 1;
        const next = indexRef.current + 1;
        if (next >= STEPS.length) {
          setDone(true);
          setRunning(false);
          return 0;
        }
        indexRef.current = next;
        setIndex(next);
        return STEPS[next].seconds;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, done]);

  const begin = useCallback(() => {
    if (done) {
      indexRef.current = 0;
      setIndex(0);
      setLeft(STEPS[0].seconds);
      setDone(false);
    }
    setRunning(true);
  }, [done]);

  const skip = useCallback(() => {
    const next = indexRef.current + 1;
    if (next >= STEPS.length) {
      setDone(true);
      setRunning(false);
      indexRef.current = 0;
      setIndex(0);
      setLeft(STEPS[0].seconds);
      return;
    }
    indexRef.current = next;
    setIndex(next);
    setLeft(STEPS[next].seconds);
  }, []);

  const restart = useCallback(() => {
    indexRef.current = 0;
    setIndex(0);
    setLeft(STEPS[0].seconds);
    setDone(false);
    setRunning(false);
  }, []);

  const step = STEPS[index];
  const elapsed = STEPS.slice(0, index).reduce((s, st) => s + st.seconds, 0) + (step.seconds - left);
  const stepPct = ((step.seconds - left) / step.seconds) * 100;
  const overallPct = (elapsed / TOTAL) * 100;

  if (done) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-surface p-8 text-center">
        <CheckCircle size={44} className="mx-auto text-accent" weight="fill" aria-hidden />
        <h2 className="mt-4 text-2xl font-bold">Warmed up.</h2>
        <p className="mx-auto mt-2 max-w-md text-muted">
          Your folds are balanced and ready. Head into a lesson or a practice session while the voice
          feels easy.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href="/practice" className={btnPrimary}>
            Start practising
          </a>
          <button type="button" onClick={restart} className={btnLine}>
            <ArrowClockwise size={18} aria-hidden /> Run it again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-surface2 to-surface p-8">
        <div className="flex items-center justify-between text-sm text-faint">
          <span>
            Step {index + 1} of {STEPS.length}
          </span>
          <span>{mmss(TOTAL - elapsed)} left</span>
        </div>

        <h2 className="mt-3 text-2xl font-bold">{step.name}</h2>
        <p className="mt-2 text-muted">{step.cue}</p>

        <p className="mt-6 text-center text-6xl font-extrabold tabular-nums" aria-live="polite">
          {mmss(left)}
        </p>

        <div className="mt-6">
          <div className="h-2 overflow-hidden rounded-full bg-bg2">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${stepPct}%` }}
            />
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-bg2">
            <div className="h-full rounded-full bg-white/30" style={{ width: `${overallPct}%` }} />
          </div>
        </div>

        <div className="mt-7 flex justify-center gap-3">
          {running ? (
            <button type="button" onClick={() => setRunning(false)} className={btnLine}>
              <Pause size={18} aria-hidden /> Pause
            </button>
          ) : (
            <button type="button" onClick={begin} className={btnPrimary}>
              <Play size={18} weight="fill" aria-hidden /> {left === step.seconds && index === 0 ? 'Start' : 'Resume'}
            </button>
          )}
          <button type="button" onClick={skip} className={btnLine}>
            <SkipForward size={18} aria-hidden /> Skip step
          </button>
          <button type="button" onClick={restart} className={btnLine}>
            <ArrowClockwise size={18} aria-hidden /> Restart
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-faint">
        Tip: open Practice in another tab to watch your pitch line stay unbroken as you slide.
      </p>
    </div>
  );
}
