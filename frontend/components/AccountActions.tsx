'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignOut } from '@phosphor-icons/react';
import type { Dictionary } from '@/lib/i18n';
import { btnLine } from './ui';

export default function AccountActions({ labels }: { labels: Pick<Dictionary['auth'], 'signingOut' | 'signOut'> }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button type="button" onClick={logout} disabled={pending} className={btnLine}>
      <SignOut size={18} aria-hidden /> {pending ? labels.signingOut : labels.signOut}
    </button>
  );
}
