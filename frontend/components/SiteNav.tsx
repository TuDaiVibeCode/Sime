'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Waveform } from '@phosphor-icons/react';
import { NAV_ITEMS, SITE } from '@/lib/site';
import type { Dictionary, Locale } from '@/lib/i18n';
import LanguageSwitcher from './LanguageSwitcher';

export default function SiteNav({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const pathname = usePathname();
  const nav = dictionary.nav;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-bg/70 backdrop-blur-md md:h-dvh md:w-64 md:border-b-0 md:border-r">
      <nav className="flex h-[68px] w-full items-center justify-between px-6 md:h-full md:flex-col md:items-start md:justify-start md:py-8">
        <Link href="/" className="flex items-center gap-2 font-bold" aria-label={`${SITE.name} home`}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-on-accent">
            <Waveform size={20} weight="bold" aria-hidden />
          </span>
          <span className="text-lg">{SITE.name}</span>
        </Link>

        <ul className="flex items-center gap-7 md:mt-10 md:w-full md:flex-col md:items-start md:gap-4">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href} className="md:w-full">
                <Link
                  href={item.href}
                  className={`block text-sm font-medium transition md:rounded-lg md:px-3 md:py-2 ${
                    active ? 'text-text md:bg-white/5' : 'text-muted hover:text-text md:hover:bg-white/5'
                  }`}
                >
                  {nav[item.key]}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3 md:mt-auto md:w-full md:flex-col md:items-start">
          <LanguageSwitcher locale={locale} labels={dictionary} />
        </div>
      </nav>
    </header>
  );
}
