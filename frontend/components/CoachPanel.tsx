'use client';

import { useState, type FormEvent } from 'react';
import { ChatTeardropDots, WarningCircle, Sparkle, ArrowClockwise, PaperPlaneRight } from '@phosphor-icons/react';
import { btnPrimary } from './ui';
import type { VoiceProfile } from '@/lib/api';

const FOCUS = [
  { value: 'crack-high', label: 'Cracking on high notes', err: 'strain', tech: 'mix' },
  { value: 'flat', label: 'Going flat / under pitch', err: 'flat', tech: 'chest', devSt: -1.2 },
  { value: 'breathy', label: 'Breathy or weak tone', err: 'breathy', tech: 'breath' },
  { value: 'belt-strain', label: 'Strained chest belt', err: 'strain', tech: 'belt', hnrDrop: true },
  { value: 'nasal', label: 'Nasal or muffled tone', err: 'nasal', tech: 'head' },
  { value: 'timing', label: 'Timing and rhythm', err: 'timing', tech: 'unknown' },
] as const;

const METRICS_BY_FOCUS: Record<string, { rpa: number; vStab: number; avqi: number; cpps: number }> = {
  'crack-high': { rpa: 82, vStab: 0.68, avqi: 3.4, cpps: 12 },
  flat: { rpa: 70, vStab: 0.78, avqi: 2.4, cpps: 14 },
  breathy: { rpa: 84, vStab: 0.72, avqi: 3.0, cpps: 9 },
  'belt-strain': { rpa: 80, vStab: 0.66, avqi: 3.8, cpps: 11 },
  nasal: { rpa: 85, vStab: 0.8, avqi: 2.6, cpps: 13 },
  timing: { rpa: 83, vStab: 0.82, avqi: 2.2, cpps: 15 },
};

export default function CoachPanel({
  profile,
  lessonTitle,
  lessonContext,
}: {
  profile: VoiceProfile | null;
  lessonTitle?: string;
  lessonContext?: string;
}) {
  const [focus, setFocus] = useState<(typeof FOCUS)[number]['value']>('crack-high');
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setReply(null);

    const chosen = FOCUS.find((f) => f.value === focus)!;
    const metrics = METRICS_BY_FOCUS[focus];
    const errorEntry: Record<string, unknown> = {
      ts: [12, 16],
      err: chosen.err,
      tech: chosen.tech,
    };
    if ('devSt' in chosen) errorEntry.devSt = chosen.devSt;
    if ('hnrDrop' in chosen) errorEntry.hnrDrop = chosen.hnrDrop;

    const voiceType = profile?.voiceType || 'Baritone';
    const voiceColor = profile?.voiceColor || 'Tho - warm, grounded, powerful';
    const low = profile?.lowestNote || 'A2';
    const high = profile?.highestNote || 'E4';

    try {
      const res = await fetch('/api/analysis/coach', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          voiceType,
          voiceColor,
          range: [low, high],
          songKeyShift: 'no shift',
          metrics,
          errorLog: [errorEntry],
          context: lessonContext || (lessonTitle ? `Currently practicing lesson: ${lessonTitle}` : undefined),
        }),
      });
      if (res.status === 401) {
        setError('Your session expired. Sign in again to use the coach.');
        return;
      }
      if (res.status === 503) {
        setError('The coach is not configured. Add OPENAI_API_KEY to backend/.env and restart the backend.');
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? `The coach could not respond (${res.status}).`);
        return;
      }
      const data = (await res.json()) as { coaching?: { text?: string } };
      setReply(data.coaching?.text?.trim() || 'The coach returned an empty reply. Try again.');
    } catch {
      setError('Could not reach the coach service.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full rounded-2xl border border-white/10 bg-surface overflow-hidden">
      <div className="border-b border-white/10 bg-bg2 p-4">
        <h3 className="flex items-center gap-2 font-bold text-lg">
          <Sparkle size={18} className="text-accent" weight="fill" aria-hidden />
          AI Vocal Coach
        </h3>
        <p className="text-sm text-muted mt-1">
          {profile ? `Tuned for your ${profile.voiceType} voice.` : 'Sign in to tune to your voice.'}
        </p>
      </div>

      <div className="flex-1 p-5 overflow-y-auto min-h-[300px] flex flex-col justify-end">
        {loading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            <div className="h-4 w-3/4 bg-white/10 rounded-full"></div>
            <div className="h-4 w-full bg-white/10 rounded-full"></div>
            <div className="h-4 w-5/6 bg-white/10 rounded-full"></div>
            <div className="mt-2 text-xs text-accent text-center font-medium">Sime is analyzing your technique...</div>
          </div>
        ) : reply ? (
          <div className="mt-auto">
            <div className="bg-accent/10 border border-accent/20 rounded-2xl rounded-bl-sm p-4 shadow-lg">
              <div className="space-y-3 text-sm text-text leading-relaxed">
                {reply.split(/\n+/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReply(null)}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-accent transition-colors"
            >
              <ArrowClockwise size={14} aria-hidden /> Ask another question
            </button>
          </div>
        ) : (
          <div className="flex h-full flex-col justify-center text-center px-4 py-8 mt-auto mb-auto">
            <div className="mx-auto w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 ring-1 ring-white/10">
              <ChatTeardropDots size={32} className="text-accent" aria-hidden />
            </div>
            <p className="text-sm text-muted">
              Select what you're struggling with in this drill. Sime will guide you with safe, customized advice.
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-white/10 bg-bg2 p-4">
        <form onSubmit={submit} className="flex gap-2 items-center">
          <select
            value={focus}
            onChange={(e) => setFocus(e.target.value as typeof focus)}
            className="flex-1 min-w-0 rounded-xl border border-white/15 bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
            disabled={loading || !!reply}
          >
            {FOCUS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <button 
            type="submit" 
            className="rounded-xl bg-accent p-2.5 text-on-accent transition hover:bg-accent-hover disabled:opacity-50" 
            disabled={loading || !!reply}
            title="Ask Coach"
          >
            {loading ? <ArrowClockwise size={20} className="animate-spin" aria-hidden /> : <PaperPlaneRight size={20} aria-hidden />}
          </button>
        </form>
        {error ? (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-accent">
            <WarningCircle size={14} className="mt-0.5 shrink-0" aria-hidden />
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
