'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle } from '@phosphor-icons/react';
import type { Dictionary } from '@/lib/i18n';
import { btnLine } from './ui';

export default function LessonProgressButton({
  lessonId,
  labels,
}: {
  lessonId: string;
  labels: Dictionary['progressButton'];
}) {
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'auth' | 'error'>('idle');

  async function markComplete() {
    setState('saving');
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          status: 'completed',
          analysisSummary: { source: 'frontend_lesson' },
        }),
      });
      if (res.status === 401) {
        setState('auth');
        return;
      }
      setState(res.ok ? 'saved' : 'error');
    } catch {
      setState('error');
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={markComplete} disabled={state === 'saving'} className={btnLine}>
        <CheckCircle size={18} aria-hidden />
        {state === 'saving' ? labels.saving : state === 'saved' ? labels.saved : labels.markComplete}
      </button>
      {state === 'auth' ? (
        <Link href="/account" className="text-sm font-semibold text-accent">
          {labels.signInToSave}
        </Link>
      ) : null}
      {state === 'error' ? <span className="text-sm text-accent">{labels.couldNotSave}</span> : null}
    </div>
  );
}
