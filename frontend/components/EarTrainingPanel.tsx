'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, ArrowClockwise, CheckCircle, XCircle, Ear } from '@phosphor-icons/react';
import { midiToFreq } from '@/lib/pitchClient';
import { btnPrimary, btnLine } from './ui';

interface Interval {
  name: string;
  semitones: number;
}

const INTERVALS: Interval[] = [
  { name: 'Minor 3rd', semitones: 3 },
  { name: 'Major 3rd', semitones: 4 },
  { name: 'Perfect 4th', semitones: 5 },
  { name: 'Perfect 5th', semitones: 7 },
  { name: 'Major 6th', semitones: 9 },
  { name: 'Octave', semitones: 12 },
];

const TOTAL = 8;
const ROOT_POOL = [48, 50, 52, 53, 55, 57, 59, 60]; // C3 to C4

type Phase = 'idle' | 'playing' | 'answer' | 'feedback' | 'done';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function EarTrainingPanel() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [round, setRound] = useState(0);
  const [choices, setChoices] = useState<Interval[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const rootRef = useRef(60);
  const intervalRef = useRef<Interval>(INTERVALS[0]);
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new AudioCtx();
    }
    return ctxRef.current;
  }, []);

  const playTone = useCallback((freq: number, ms: number, when = 0) => {
    const ctx = ensureCtx();
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.2, t0 + 0.04);
    gain.gain.setValueAtTime(0.2, t0 + ms / 1000 - 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + ms / 1000);
  }, [ensureCtx]);

  const playInterval = useCallback(() => {
    const root = rootRef.current;
    const semis = intervalRef.current.semitones;
    playTone(midiToFreq(root), 650, 0);
    playTone(midiToFreq(root + semis), 650, 0.75);
  }, [playTone]);

  const nextRound = useCallback(
    (r: number) => {
      if (r >= TOTAL) {
        setPhase('done');
        return;
      }
      setRound(r + 1);
      setPicked(null);
      rootRef.current = ROOT_POOL[Math.floor(Math.random() * ROOT_POOL.length)];
      const correct = INTERVALS[Math.floor(Math.random() * INTERVALS.length)];
      intervalRef.current = correct;
      const distractors = shuffle(INTERVALS.filter((i) => i.name !== correct.name)).slice(0, 3);
      setChoices(shuffle([correct, ...distractors]));
      setPhase('playing');
      playInterval();
      timersRef.current.push(window.setTimeout(() => setPhase('answer'), 1500));
    },
    [playInterval]
  );

  const start = useCallback(() => {
    clearTimers();
    setCorrectCount(0);
    setRound(0);
    nextRound(0);
  }, [nextRound]);

  const answer = useCallback(
    (choice: Interval) => {
      if (phase !== 'answer') return;
      setPicked(choice.name);
      const isCorrect = choice.name === intervalRef.current.name;
      if (isCorrect) setCorrectCount((c) => c + 1);
      setPhase('feedback');
      timersRef.current.push(window.setTimeout(() => nextRound(round), 1100));
    },
    [phase, round, nextRound]
  );

  useEffect(() => {
    return () => {
      clearTimers();
      if (ctxRef.current && ctxRef.current.state !== 'closed') void ctxRef.current.close();
      ctxRef.current = null;
    };
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      {phase === 'done' ? (
        <div className="rounded-2xl border border-white/10 bg-surface p-8 text-center">
          <p className="text-xs font-semibold uppercase text-accent">Result</p>
          <p className="mt-2 text-3xl font-extrabold">
            {correctCount} of {TOTAL} correct
          </p>
          <p className="mx-auto mt-2 max-w-md text-muted">
            {correctCount >= 7
              ? 'Sharp relative pitch. You hear intervals well.'
              : correctCount >= 4
                ? 'Good progress. Keep training the trickier intervals.'
                : 'Early days. Sing each interval back to fix its sound in your ear.'}
          </p>
          <button type="button" onClick={start} className={`${btnPrimary} mt-6`}>
            <ArrowClockwise size={18} aria-hidden /> Again
          </button>
        </div>
      ) : phase === 'idle' ? (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-surface2 to-surface p-8 text-center">
          <Ear size={40} className="mx-auto text-accent" aria-hidden />
          <h2 className="mt-4 text-xl font-bold">Name the interval</h2>
          <p className="mx-auto mt-2 max-w-md text-muted">
            Sime plays two notes. Pick the interval between them. {TOTAL} rounds. This trains relative
            pitch, the skill behind harmony and singing in tune without a reference.
          </p>
          <button type="button" onClick={start} className={`${btnPrimary} mt-6`}>
            <Play size={18} weight="fill" aria-hidden /> Start
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-surface2 to-surface p-8">
          <div className="flex items-center justify-between text-sm text-faint">
            <span>
              Round {round} of {TOTAL}
            </span>
            <span>{correctCount} correct</span>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={playInterval}
              className={btnLine}
              disabled={phase === 'playing'}
            >
              <Play size={18} weight="fill" aria-hidden /> Replay
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {choices.map((c) => {
              const isPicked = picked === c.name;
              const isCorrect = c.name === intervalRef.current.name;
              const showState = phase === 'feedback';
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => answer(c)}
                  disabled={phase !== 'answer'}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition disabled:cursor-default ${
                    showState && isCorrect
                      ? 'border-[#6FE0A6]/50 text-[#6FE0A6]'
                      : showState && isPicked
                        ? 'border-accent/50 text-accent'
                        : 'border-white/15 text-text hover:border-accent/40'
                  }`}
                >
                  {c.name}
                  {showState && isCorrect ? (
                    <CheckCircle size={16} weight="fill" aria-hidden />
                  ) : showState && isPicked ? (
                    <XCircle size={16} aria-hidden />
                  ) : null}
                </button>
              );
            })}
          </div>

          <p className="mt-5 text-center text-sm text-muted" aria-live="polite">
            {phase === 'playing' ? 'Listen...' : phase === 'answer' ? 'Which interval was that?' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
