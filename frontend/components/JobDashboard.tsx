'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Lightning, ArrowsClockwise } from '@phosphor-icons/react';
import type { AnalysisJob, AnalysisJobStatus, AnalysisJobType } from '@/lib/api';
import { btnPrimary } from './ui';

const JOB_TYPES: { value: AnalysisJobType; label: string }[] = [
  { value: 'swiftf0', label: 'SwiftF0 - realtime pitch' },
  { value: 'rmvpe', label: 'RMVPE - music-backed vocals' },
  { value: 'crepe', label: 'CREPE - deep offline pass' },
  { value: 'range', label: 'Vocal range' },
  { value: 'transposition', label: 'Transposition' },
  { value: 'coach_payload', label: 'Coaching payload' },
  { value: 'health', label: 'Vocal health metrics' },
  { value: 'technique', label: 'Technique thresholds' },
];

const TERMINAL: AnalysisJobStatus[] = ['succeeded', 'failed'];
const POLL_MS = 2000;
const MAX_POLLS = 30;

const STATUS_TONE: Record<AnalysisJobStatus, string> = {
  queued: 'border-white/15 text-muted',
  running: 'border-accent/40 text-accent',
  succeeded: 'border-emerald-400/40 text-emerald-300',
  failed: 'border-red-400/40 text-red-300',
};

const DEFAULT_PAYLOAD = '{\n  "source": "studio"\n}';

type UiState = 'idle' | 'submitting' | 'polling' | 'done' | 'auth' | 'error';

export default function JobDashboard() {
  const [jobType, setJobType] = useState<AnalysisJobType>('swiftf0');
  const [payloadText, setPayloadText] = useState(DEFAULT_PAYLOAD);
  const [job, setJob] = useState<AnalysisJob | null>(null);
  const [queuedInRedis, setQueuedInRedis] = useState<boolean | null>(null);
  const [state, setState] = useState<UiState>('idle');
  const [message, setMessage] = useState<string | null>(null);
  // Bumped on every run so a stale poll loop from an earlier run can detect it
  // is no longer current and stop touching state.
  const runId = useRef(0);

  async function poll(id: string, attempt: number, thisRun: number) {
    if (thisRun !== runId.current) return;
    try {
      const res = await fetch(`/api/analysis/jobs/${id}`, { cache: 'no-store' });
      if (thisRun !== runId.current) return;
      if (!res.ok) {
        setState('error');
        setMessage(`Could not read job status (${res.status}).`);
        return;
      }
      const data = (await res.json()) as { job: AnalysisJob };
      if (thisRun !== runId.current) return;
      setJob(data.job);
      if (TERMINAL.includes(data.job.status)) {
        setState('done');
        return;
      }
      if (attempt >= MAX_POLLS) {
        setState('done');
        setMessage('Still queued. No Python worker has picked this job up yet.');
        return;
      }
      window.setTimeout(() => poll(id, attempt + 1, thisRun), POLL_MS);
    } catch {
      if (thisRun !== runId.current) return;
      setState('error');
      setMessage('Lost connection while polling job status.');
    }
  }

  async function run() {
    let requestPayload: unknown;
    try {
      requestPayload = JSON.parse(payloadText);
    } catch {
      setState('error');
      setMessage('Request payload must be valid JSON.');
      return;
    }
    if (typeof requestPayload !== 'object' || requestPayload === null || Array.isArray(requestPayload)) {
      setState('error');
      setMessage('Request payload must be a JSON object.');
      return;
    }

    const thisRun = ++runId.current;
    setState('submitting');
    setMessage(null);
    setJob(null);
    setQueuedInRedis(null);

    try {
      const res = await fetch('/api/analysis/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobType, requestPayload }),
      });
      if (thisRun !== runId.current) return;
      if (res.status === 401) {
        setState('auth');
        return;
      }
      if (res.status === 503) {
        setState('error');
        setMessage('Backend database is not configured, so jobs cannot be stored yet.');
        return;
      }
      if (!res.ok) {
        setState('error');
        setMessage(`Could not create job (${res.status}).`);
        return;
      }
      const data = (await res.json()) as {
        job: AnalysisJob;
        dispatch: { queuedInRedis: boolean };
      };
      if (thisRun !== runId.current) return;
      setJob(data.job);
      setQueuedInRedis(data.dispatch?.queuedInRedis ?? null);
      setState('polling');
      window.setTimeout(() => poll(data.job.id, 1, thisRun), POLL_MS);
    } catch {
      if (thisRun !== runId.current) return;
      setState('error');
      setMessage('Could not reach the backend.');
    }
  }

  const busy = state === 'submitting' || state === 'polling';
  const resultJson =
    job && job.resultPayload != null ? JSON.stringify(job.resultPayload, null, 2) : null;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <label className="block text-sm font-medium text-muted">
          Analysis model
          <select
            value={jobType}
            onChange={(event) => setJobType(event.target.value as AnalysisJobType)}
            disabled={busy}
            className="mt-2 w-full rounded-xl border border-white/10 bg-bg2 px-4 py-3 text-text disabled:opacity-60"
          >
            {JOB_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-muted">
          Request payload (JSON)
          <textarea
            value={payloadText}
            onChange={(event) => setPayloadText(event.target.value)}
            disabled={busy}
            rows={5}
            spellCheck={false}
            className="mt-2 w-full rounded-xl border border-white/10 bg-bg2 px-4 py-3 font-mono text-sm text-text disabled:opacity-60"
          />
        </label>

        <button type="button" onClick={run} disabled={busy} className={btnPrimary}>
          {busy ? <ArrowsClockwise size={18} className="animate-spin" aria-hidden /> : <Lightning size={18} aria-hidden />}
          {state === 'submitting' ? 'Queuing' : state === 'polling' ? 'Listening for worker' : 'Run analysis'}
        </button>

        {state === 'auth' ? (
          <p className="text-sm">
            <Link href="/account" className="font-semibold text-accent">
              Sign in
            </Link>{' '}
            to queue analysis jobs.
          </p>
        ) : null}
        {message ? <p className="text-sm text-muted">{message}</p> : null}
      </div>

      {job ? (
        <div className="rounded-2xl border border-white/10 bg-bg2 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase text-faint">Job {job.id.slice(0, 8)}</p>
              <p className="mt-1 font-semibold">{job.jobType}</p>
            </div>
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${STATUS_TONE[job.status]}`}
            >
              {job.status === 'queued' || job.status === 'running' ? (
                <ArrowsClockwise size={14} className="animate-spin" aria-hidden />
              ) : null}
              {job.status}
            </span>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <dt className="text-faint">Redis dispatch</dt>
            <dd className="text-right text-muted">
              {queuedInRedis == null ? 'n/a' : queuedInRedis ? 'queued for worker' : 'Postgres-only fallback'}
            </dd>
            <dt className="text-faint">Created</dt>
            <dd className="text-right text-muted">{new Date(job.createdAt).toLocaleTimeString()}</dd>
          </dl>

          {job.errorMessage ? (
            <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/5 px-4 py-3 text-sm text-red-300">
              {job.errorMessage}
            </p>
          ) : null}

          {resultJson ? (
            <pre className="mt-4 max-h-64 overflow-auto rounded-xl border border-white/10 bg-bg p-4 font-mono text-xs text-muted">
              {resultJson}
            </pre>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}


