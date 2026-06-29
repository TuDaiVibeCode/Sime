import Link from 'next/link';
import { Waveform } from '@phosphor-icons/react/dist/ssr';
import { SITE } from '@/lib/site';
import type { Dictionary } from '@/lib/i18n';

export default function SiteFooter({ dictionary }: { dictionary: Dictionary }) {
  const cols = [
    {
      heading: dictionary.footer.product,
      links: [
        { href: '/lessons', label: dictionary.nav.lessons },
        { href: '/practice', label: dictionary.nav.practice },
        { href: '/docs', label: dictionary.nav.docs },
      ],
    },
    {
      heading: dictionary.footer.developers,
      links: [
        { href: '/api-docs', label: dictionary.footer.apiReference },
        { href: '/docs', label: dictionary.footer.guides },
      ],
    },
    {
      heading: dictionary.footer.company,
      links: [
        { href: '/about', label: dictionary.nav.about },
        { href: '/help', label: dictionary.nav.help },
      ],
    },
  ];

  return (
    <footer className="border-t border-white/10 bg-bg2">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-on-accent">
              <Waveform size={18} weight="bold" aria-hidden />
            </span>
            <span>{SITE.name}</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm text-muted">
            {dictionary.footer.body}
          </p>
        </div>
        {cols.map((col) => (
          <nav key={col.heading} aria-label={col.heading}>
            <h4 className="mb-3 text-xs font-semibold uppercase text-faint">
              {col.heading}
            </h4>
            {col.links.map((l) => (
              <Link key={l.href + l.label} href={l.href} className="block py-1.5 text-sm text-muted hover:text-accent">
                {l.label}
              </Link>
            ))}
          </nav>
        ))}
      </div>
      <div className="mx-auto w-full max-w-6xl border-t border-white/10 px-6 py-6 text-sm text-faint">
        &copy; 2026 {SITE.name}. {dictionary.site.tagline}
      </div>
    </footer>
  );
}
