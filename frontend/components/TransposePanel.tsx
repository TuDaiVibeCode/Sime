'use client';

import { useState, type FormEvent } from 'react';
import { ArrowsDownUp, CheckCircle, WarningCircle, Sparkle } from '@phosphor-icons/react';
import { btnPrimary } from './ui';

const ORDER = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_OPTIONS: string[] = [];
for (let octave = 2; octave <= 6; octave++) {
  for (const name of ORDER) NOTE_OPTIONS.push(`${name}${octave}`);
}

interface TranspositionResult {
  shiftSemitones: number;
  shiftLabel: string;
  shiftedSongRange: { low: string; high: string };
  fitsAfterShift: boolean;
  formantPreservationRecommended: boolean;
  reason: string;
}

function NoteSelect({
  label,
  value,
  onChange,
  optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  optional?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-faint">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-white/15 bg-bg2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
      >
        {optional ? <option value="">auto</option> : null}
        {NOTE_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function TransposePanel() {
  const [voiceLow, setVoiceLow] = useState('A2');
  const [voiceHigh, setVoiceHigh] = useState('E4');
  const [songLow, setSongLow] = useState('C3');
  const [songHigh, setSongHigh] = useState('G4');
  const [tessLow, setTessLow] = useState('');
  const [tessHigh, setTessHigh] = useState('');
  const [maxShift, setMaxShift] = useState(4);
  const [guideVocal, setGuideVocal] = useState(false);

  const [result, setResult] = useState<TranspositionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const songRange: Record<string, string> = { low: songLow, high: songHigh };
      if (tessLow) songRange.tessituraLow = tessLow;
      if (tessHigh) songRange.tessituraHigh = tessHigh;
      const res = await fetch('/api/analysis/transpose', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          voiceRange: { low: voiceLow, high: voiceHigh },
          songRange,
          maxShiftSemitones: maxShift,
          includesGuideVocal: guideVocal,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? 'Could not calculate a key. Check the notes and try again.');
        setResult(null);
        return;
      }
      const data = (await res.json()) as { transposition: TranspositionResult };
      setResult(data.transposition);
    } catch {
      setError('The analysis service is unavailable right now.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1.1fr_1fr]">
      <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-surface p-6">
        <fieldset>
          <legend className="text-sm font-bold">Your range</legend>
          <p className="mt-1 text-xs text-muted">
            From the range test, or your own lowest and highest comfortable notes.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <NoteSelect label="Lowest" value={voiceLow} onChange={setVoiceLow} />
            <NoteSelect label="Highest" value={voiceHigh} onChange={setVoiceHigh} />
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-sm font-bold">The song</legend>
          <p className="mt-1 text-xs text-muted">
            The song&apos;s lowest and highest notes. Tessitura is where most of it sits (optional).
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <NoteSelect label="Song lowest" value={songLow} onChange={setSongLow} />
            <NoteSelect label="Song highest" value={songHigh} onChange={setSongHigh} />
            <NoteSelect label="Tessitura low" value={tessLow} onChange={setTessLow} optional />
            <NoteSelect label="Tessitura high" value={tessHigh} onChange={setTessHigh} optional />
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-sm font-bold">Limits</legend>
          <label className="mt-3 block text-sm">
            <span className="flex items-center justify-between text-faint">
              <span>Max shift</span>
              <span className="font-semibold text-text">
                {maxShift} semitone{maxShift === 1 ? '' : 's'}
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={4}
              value={maxShift}
              onChange={(e) => setMaxShift(Number(e.target.value))}
              className="mt-2 w-full accent-[var(--color-accent)]"
            />
          </label>
          <label className="mt-3 flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={guideVocal}
              onChange={(e) => setGuideVocal(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            Includes a guide vocal (recommend formant preservation)
          </label>
        </fieldset>

        <button type="submit" className={`${btnPrimary} mt-6 w-full`} disabled={loading}>
          <ArrowsDownUp size={18} aria-hidden />
          {loading ? 'Calculating' : 'Find my key'}
        </button>
        {error ? (
          <p className="mt-3 flex items-start gap-2 text-sm text-muted">
            <WarningCircle size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden />
            {error}
          </p>
        ) : null}
      </form>

      <div className="rounded-2xl border border-white/10 bg-surface p-6">
        {result ? (
          <div>
            <p className="text-xs font-semibold uppercase text-accent">Recommended key</p>
            <p className="mt-2 text-3xl font-extrabold">{result.shiftLabel}</p>
            <p className="mt-3 text-sm text-muted">
              Song moves to {result.shiftedSongRange.low} to {result.shiftedSongRange.high}.
            </p>

            <p
              className={`mt-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
                result.fitsAfterShift
                  ? 'bg-[#6FE0A6]/15 text-[#6FE0A6]'
                  : 'bg-accent/15 text-accent'
              }`}
            >
              {result.fitsAfterShift ? (
                <CheckCircle size={15} weight="fill" aria-hidden />
              ) : (
                <WarningCircle size={15} aria-hidden />
              )}
              {result.fitsAfterShift ? 'Fits your range' : 'Best available fit'}
            </p>

            {result.formantPreservationRecommended ? (
              <p className="mt-5 flex items-start gap-2 rounded-xl border border-accent/25 bg-accent/[0.06] px-4 py-3 text-sm text-muted">
                <Sparkle size={16} className="mt-0.5 shrink-0 text-accent" weight="fill" aria-hidden />
                Use formant preservation when shifting, so a guide vocal stays natural instead of sounding like a chipmunk.
              </p>
            ) : null}

            <p className="mt-5 text-sm text-muted">{result.reason}</p>
          </div>
        ) : (
          <div className="flex h-full flex-col justify-center text-center">
            <ArrowsDownUp size={32} className="mx-auto text-faint" aria-hidden />
            <p className="mt-3 text-muted">
              Enter your range and the song, then find the safest key. Sime favours a one to two
              semitone shift and never moves more than four.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
