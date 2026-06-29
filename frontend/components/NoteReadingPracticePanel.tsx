'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowClockwise,
  CheckCircle,
  Microphone,
  SpeakerHigh,
  StopCircle,
  WarningCircle,
} from '@phosphor-icons/react';
import { btnLine, btnPrimary } from '@/components/ui';
import type { NoteReadingExercise, NoteReadingTarget } from '@/lib/lessonGuides';
import { autoCorrelate, midiToFreq, midiToName, noteFromPitch } from '@/lib/pitchClient';

interface NoteReadingPracticePanelProps {
  exercises: NoteReadingExercise[];
  onComplete?: () => void;
}

interface LivePitchState {
  detectedNote: string | null;
  cents: number | null;
  frequency: number | null;
  isOnTarget: boolean;
  holdProgress: number;
}

const NOTE_TO_PITCH_CLASS: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const LETTER_INDEX: Record<string, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
};

function parseNoteToMidi(note: string): number | null {
  const match = /^([A-G])([#b]?)(-?\d+)$/.exec(note.trim());
  if (!match) return null;

  const [, letter, accidental, octaveText] = match;
  const base = NOTE_TO_PITCH_CLASS[letter];
  const accidentalOffset = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
  const octave = Number(octaveText);

  return (octave + 1) * 12 + base + accidentalOffset;
}

function getTargetCents(freq: number, targetMidi: number): number {
  return Math.round(1200 * Math.log2(freq / midiToFreq(targetMidi)));
}

function getStaffY(note: string): number {
  const match = /^([A-G])([#b]?)(-?\d+)$/.exec(note.trim());
  if (!match) return 74;

  const [, letter, , octaveText] = match;
  const octave = Number(octaveText);
  const noteStep = octave * 7 + LETTER_INDEX[letter];
  const bottomLineE4 = 4 * 7 + LETTER_INDEX.E;
  const bottomLineY = 110;
  const staffHalfStep = 9;

  return bottomLineY - (noteStep - bottomLineE4) * staffHalfStep;
}

function StaffTarget({ target }: { target: NoteReadingTarget }) {
  const y = getStaffY(target.note);
  const staffLines = [38, 56, 74, 92, 110];
  const needsLowerLedger = y >= 124;

  return (
    <svg viewBox="0 0 360 160" role="img" aria-label={`Sheet note ${target.note}`} className="h-full w-full">
      <rect x="0" y="0" width="360" height="160" rx="18" fill="rgba(255,255,255,0.03)" />
      {staffLines.map((lineY) => (
        <line key={lineY} x1="58" x2="318" y1={lineY} y2={lineY} stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
      ))}
      <text x="76" y="107" fill="rgba(255,184,77,0.9)" fontSize="58" fontWeight="700">
        G
      </text>
      {needsLowerLedger ? (
        <line x1="206" x2="266" y1="128" y2="128" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
      ) : null}
      <ellipse cx="236" cy={y} rx="16" ry="11" transform={`rotate(-18 236 ${y})`} fill="#FFB84D" />
      <line x1="250" x2="250" y1={y - 2} y2={Math.max(34, y - 56)} stroke="#FFB84D" strokeWidth="4" strokeLinecap="round" />
      <text x="236" y="148" textAnchor="middle" fill="rgba(255,255,255,0.72)" fontSize="16" fontWeight="700">
        {target.note}
      </text>
    </svg>
  );
}

export default function NoteReadingPracticePanel({ exercises, onComplete }: NoteReadingPracticePanelProps) {
  const exercise = exercises[0];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedTargets, setCompletedTargets] = useState<number[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [livePitch, setLivePitch] = useState<LivePitchState>({
    detectedNote: null,
    cents: null,
    frequency: null,
    isOnTarget: false,
    holdProgress: 0,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const holdStartRef = useRef<number | null>(null);
  const targetPassedRef = useRef(false);
  const completionNotifiedRef = useRef(false);

  const fallbackTarget = exercise?.targets[exercise.targets.length - 1];
  const currentTarget = exercise?.targets[currentIndex] ?? fallbackTarget;
  const targetMidi = useMemo(() => (currentTarget ? parseNoteToMidi(currentTarget.note) : null), [currentTarget]);
  const completedCount = completedTargets.length;
  const score = exercise ? Math.round((completedCount / exercise.targets.length) * 100) : 0;
  const isComplete = Boolean(exercise && completedCount === exercise.targets.length && score >= exercise.passScore);

  const stopListening = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    sourceRef.current?.disconnect();
    sourceRef.current = null;
    analyserRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    void audioContextRef.current?.close();
    audioContextRef.current = null;

    holdStartRef.current = null;
    targetPassedRef.current = false;
    setIsListening(false);
    setLivePitch((current) => ({ ...current, isOnTarget: false, holdProgress: 0 }));
  }, []);

  const startListening = useCallback(async () => {
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Trình duyệt không hỗ trợ microphone cho bài thực hành này.');
      return;
    }

    const AudioContextCtor = window.AudioContext ??
      (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) {
      setError('Trình duyệt không hỗ trợ Web Audio để chấm cao độ.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      const audioContext = new AudioContextCtor();
      await audioContext.resume();

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      streamRef.current = stream;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;
      setIsListening(true);
    } catch {
      setError('Không mở được microphone. Hãy cấp quyền mic rồi thử lại.');
      stopListening();
    }
  }, [stopListening]);

  const playReference = useCallback(async () => {
    if (targetMidi === null) return;

    const AudioContextCtor = window.AudioContext ??
      (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(midiToFreq(targetMidi), now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.9);
    oscillator.onended = () => {
      void context.close();
    };
  }, [targetMidi]);

  const resetExercise = useCallback(() => {
    setCurrentIndex(0);
    setCompletedTargets([]);
    holdStartRef.current = null;
    targetPassedRef.current = false;
    completionNotifiedRef.current = false;
    setLivePitch({ detectedNote: null, cents: null, frequency: null, isOnTarget: false, holdProgress: 0 });
  }, []);

  useEffect(() => {
    holdStartRef.current = null;
    targetPassedRef.current = false;
  }, [currentIndex]);

  useEffect(() => {
    if (!isListening || !exercise || !currentTarget || targetMidi === null || isComplete) return;

    const tick = () => {
      const analyser = analyserRef.current;
      const audioContext = audioContextRef.current;
      if (!analyser || !audioContext) return;

      const buffer = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(buffer);
      const freq = autoCorrelate(buffer, audioContext.sampleRate);

      if (freq === -1) {
        holdStartRef.current = null;
        setLivePitch((current) => ({ ...current, isOnTarget: false, holdProgress: 0 }));
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const detected = noteFromPitch(freq);
      const cents = getTargetCents(freq, targetMidi);
      const isOnTarget = Math.abs(cents) <= exercise.toleranceCents && detected.midi === targetMidi;
      const now = performance.now();
      let holdProgress = 0;

      if (isOnTarget) {
        holdStartRef.current = holdStartRef.current ?? now;
        holdProgress = Math.min(1, (now - holdStartRef.current) / exercise.holdMs);
      } else {
        holdStartRef.current = null;
      }

      setLivePitch({
        detectedNote: detected.name,
        cents,
        frequency: Math.round(freq * 10) / 10,
        isOnTarget,
        holdProgress,
      });

      if (isOnTarget && holdProgress >= 1 && !targetPassedRef.current) {
        targetPassedRef.current = true;
        setCompletedTargets((current) => (current.includes(currentIndex) ? current : [...current, currentIndex]));
        setCurrentIndex((current) => Math.min(current + 1, exercise.targets.length - 1));
        holdStartRef.current = null;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [currentIndex, currentTarget, exercise, isComplete, isListening, targetMidi]);

  useEffect(() => {
    if (!isComplete || completionNotifiedRef.current) return;

    completionNotifiedRef.current = true;
    onComplete?.();
    stopListening();
  }, [isComplete, onComplete, stopListening]);

  useEffect(() => stopListening, [stopListening]);

  if (!exercise || !currentTarget) return null;

  const targetName = targetMidi === null ? currentTarget.note : midiToName(targetMidi);
  const centsLabel = livePitch.cents === null ? '--' : `${livePitch.cents > 0 ? '+' : ''}${livePitch.cents} cents`;

  return (
    <div className="rounded-2xl border border-white/10 bg-surface p-6 shadow-xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-accent">Bài thực hành đọc nốt</p>
          <h2 className="mt-1 text-xl font-bold text-text">{exercise.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{exercise.instructions}</p>
        </div>
        <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
          {completedCount} / {exercise.targets.length} nốt
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="min-h-[280px] rounded-2xl border border-white/10 bg-bg2/80 p-4">
          <StaffTarget target={currentTarget} />
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-bg2/80 p-5">
            <p className="text-xs font-semibold uppercase text-muted">Nốt cần hát</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <div>
                <p className="text-4xl font-extrabold text-accent">{targetName}</p>
                <p className="mt-1 text-sm text-muted">{currentTarget.label}</p>
              </div>
              {completedTargets.includes(currentIndex) ? (
                <CheckCircle size={34} weight="fill" className="text-green-400" />
              ) : null}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">{currentTarget.hint}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-bg2/80 p-4">
              <p className="text-xs font-semibold uppercase text-muted">Mic nghe được</p>
              <p className="mt-2 text-2xl font-bold text-text">{livePitch.detectedNote ?? '--'}</p>
              <p className="mt-1 text-xs text-muted">{livePitch.frequency ? `${livePitch.frequency} Hz` : 'Đang chờ tín hiệu'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-bg2/80 p-4">
              <p className="text-xs font-semibold uppercase text-muted">Lệch cao độ</p>
              <p className={`mt-2 text-2xl font-bold ${livePitch.isOnTarget ? 'text-green-400' : 'text-accent'}`}>
                {centsLabel}
              </p>
              <p className="mt-1 text-xs text-muted">Ngưỡng ±{exercise.toleranceCents} cents</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-bg2/80 p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-text">Giữ đúng nốt</span>
              <span className="text-muted">{Math.round(livePitch.holdProgress * 100)}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all ${livePitch.isOnTarget ? 'bg-green-400' : 'bg-accent'}`}
                style={{ width: `${Math.round(livePitch.holdProgress * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
          <WarningCircle size={20} weight="fill" className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}

      {isComplete ? (
        <div className="mt-5 rounded-2xl border border-green-500/30 bg-green-500/10 p-5 text-green-100">
          <h3 className="flex items-center gap-2 font-bold">
            <CheckCircle size={22} weight="fill" /> Hoàn thành bài đọc nốt
          </h3>
          <p className="mt-2 text-sm text-green-100/85">
            Bạn đã hát đúng toàn bộ nốt trong sheet thực hành với điểm {score}%.
          </p>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted">
          Điểm hiện tại: <span className="font-bold text-text">{score}%</span> · Cần đạt {exercise.passScore}%
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={playReference} className={btnLine}>
            <SpeakerHigh size={18} weight="bold" /> Nghe mẫu
          </button>
          <button type="button" onClick={resetExercise} className={btnLine}>
            <ArrowClockwise size={18} weight="bold" /> Làm lại
          </button>
          {isListening ? (
            <button type="button" onClick={stopListening} className={btnLine}>
              <StopCircle size={18} weight="bold" /> Dừng mic
            </button>
          ) : (
            <button type="button" onClick={startListening} className={btnPrimary} disabled={isComplete}>
              <Microphone size={18} weight="bold" /> Bắt đầu mic
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


