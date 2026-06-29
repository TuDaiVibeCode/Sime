import Link from 'next/link';
import type { ReactNode } from 'react';

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-on-accent transition hover:bg-accent-strong active:translate-y-px';

export const btnLine =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold text-text transition hover:border-accent hover:text-accent active:translate-y-px';

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-6 ${className}`}>{children}</div>;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg border border-white/10 bg-surface p-6 shadow-[0_1px_2px_rgba(0,0,0,0.18)] ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lead,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
}) {
  return (
    <header className="relative overflow-hidden border-b border-white/10 bg-bg2">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[620px] -translate-x-1/2 rounded-full"
        style={{
          background: 'radial-gradient(closest-side, rgba(255,184,77,0.10), transparent 70%)',
        }}
      />
      <Container className="relative py-16 md:py-24">
        {eyebrow ? (
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="max-w-3xl text-4xl font-extrabold md:text-5xl">{title}</h1>
        {lead ? <p className="mt-5 max-w-2xl text-lg text-muted">{lead}</p> : null}
      </Container>
    </header>
  );
}

export function CTALink({
  href,
  children,
  variant = 'primary',
}: {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'line';
}) {
  return (
    <Link href={href} className={variant === 'primary' ? btnPrimary : btnLine}>
      {children}
    </Link>
  );
}

