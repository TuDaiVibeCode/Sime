'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Translate } from '@phosphor-icons/react';
import { LOCALES, type Dictionary, type Locale } from '@/lib/i18n';

export default function LanguageSwitcher({
  locale,
  labels,
}: {
  locale: Locale;
  labels: Pick<Dictionary, 'localeName' | 'nav'>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setLocale(nextLocale: Locale) {
    if (nextLocale === locale) return;
    startTransition(async () => {
      await fetch('/api/i18n/locale', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ locale: nextLocale }),
      });
      router.refresh();
    });
  }

  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-bg2 px-3 py-2 text-sm text-muted">
      <Translate size={16} className="text-accent" aria-hidden />
      <span className="sr-only">{labels.nav.language}</span>
      <select
        value={locale}
        disabled={pending}
        onChange={(event) => setLocale(event.target.value as Locale)}
        className="bg-transparent text-sm font-semibold text-text outline-none"
        aria-label={labels.nav.language}
      >
        {LOCALES.map((item) => (
          <option key={item} value={item} className="bg-bg text-text">
            {item.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
