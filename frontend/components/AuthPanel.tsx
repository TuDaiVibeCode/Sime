'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignIn, UserPlus } from '@phosphor-icons/react';
import type { Dictionary } from '@/lib/i18n';
import { btnLine, btnPrimary } from './ui';

type Mode = 'login' | 'register';

export default function AuthPanel({ labels }: { labels: Dictionary['auth'] }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const displayName = String(form.get('displayName') ?? '').trim();
    const payload = {
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
      ...(mode === 'register' && displayName ? { displayName } : {}),
    };

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setError(mode === 'login' ? labels.invalidLogin : labels.createError);
        return;
      }
      router.refresh();
    } catch {
      setError(labels.backendUnavailable);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-surface p-6">
      <div className="mb-6 inline-flex rounded-full border border-white/10 bg-bg2 p-1">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            mode === 'login' ? 'bg-accent text-on-accent' : 'text-muted'
          }`}
        >
          {labels.signIn}
        </button>
        <button
          type="button"
          onClick={() => setMode('register')}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            mode === 'register' ? 'bg-accent text-on-accent' : 'text-muted'
          }`}
        >
          {labels.register}
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === 'register' ? (
          <label className="block text-sm font-medium text-muted">
            {labels.displayName}
            <input
              name="displayName"
              maxLength={80}
              className="mt-2 w-full rounded-xl border border-white/10 bg-bg2 px-4 py-3 text-text"
              autoComplete="name"
            />
          </label>
        ) : null}
        <label className="block text-sm font-medium text-muted">
          {labels.email}
          <input
            required
            name="email"
            type="email"
            maxLength={254}
            className="mt-2 w-full rounded-xl border border-white/10 bg-bg2 px-4 py-3 text-text"
            autoComplete="email"
          />
        </label>
        <label className="block text-sm font-medium text-muted">
          {labels.password}
          <input
            required
            name="password"
            type="password"
            minLength={8}
            maxLength={200}
            className="mt-2 w-full rounded-xl border border-white/10 bg-bg2 px-4 py-3 text-text"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </label>

        {error ? <p className="text-sm text-accent">{error}</p> : null}

        <button type="submit" disabled={pending} className={mode === 'login' ? btnPrimary : btnLine}>
          {mode === 'login' ? <SignIn size={18} aria-hidden /> : <UserPlus size={18} aria-hidden />}
          {pending ? labels.working : mode === 'login' ? labels.signIn : labels.createAccount}
        </button>
      </form>
    </div>
  );
}
