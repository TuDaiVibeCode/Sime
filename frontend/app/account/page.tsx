import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, ClockCounterClockwise, UserCircle, Waveform } from '@phosphor-icons/react/dist/ssr';
import { getCurrentUser, getProgress } from '@/lib/api';
import { Container, PageHeader, Card } from '@/components/ui';
import AuthPanel from '@/components/AuthPanel';
import AccountActions from '@/components/AccountActions';
import { getRequestDictionary } from '@/lib/i18n-server';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { dictionary } = await getRequestDictionary();
  return {
    title: dictionary.account.title,
    description: dictionary.account.description,
  };
}

export default async function AccountPage() {
  const { locale, dictionary } = await getRequestDictionary();
  const user = await getCurrentUser();
  const progress = user ? await getProgress() : [];
  const completed = progress.filter((item) => item.status === 'completed').length;

  return (
    <>
      <PageHeader
        eyebrow={dictionary.account.title}
        title={
          user
            ? `${dictionary.home.welcomeBack}${user.displayName ? `, ${user.displayName}` : ''}.`
            : dictionary.account.signedOutTitle
        }
        lead={
          user
            ? dictionary.account.signedInLead
            : dictionary.account.signedOutLead
        }
      />
      <Container className="py-16">
        {user ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <Card>
              <div className="flex items-start gap-3">
                <UserCircle size={32} className="text-accent" aria-hidden />
                <div>
                  <h2 className="text-xl font-bold">{dictionary.account.session}</h2>
                  <p className="mt-2 text-sm text-muted">{user.email}</p>
                  <p className="mt-1 text-sm text-faint">{user.role}</p>
                </div>
              </div>
              <div className="mt-6">
                <AccountActions labels={dictionary.auth} />
              </div>
              <Link
                href="/studio"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent"
              >
                {dictionary.account.openStudio}
                <Waveform size={15} aria-hidden />
              </Link>
            </Card>

            <Card>
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">{dictionary.account.progress}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {completed} {dictionary.account.completedLessons}
                  </p>
                </div>
                <Link href="/lessons" className="text-sm font-semibold text-accent">
                  {dictionary.nav.lessons}
                </Link>
              </div>

              {progress.length ? (
                <ul className="divide-y divide-white/10">
                  {progress.slice(0, 8).map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-4 py-4">
                      <span>
                        <span className="block font-semibold">
                          {item.lessonId ?? dictionary.common.practiceSession}
                        </span>
                        <span className="mt-1 flex items-center gap-1.5 text-sm text-faint">
                          <ClockCounterClockwise size={15} aria-hidden />
                          {new Date(item.createdAt).toLocaleDateString(locale)}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                        <CheckCircle size={16} className="text-accent" aria-hidden />
                        {item.status}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">{dictionary.account.noProgress}</p>
              )}
            </Card>
          </div>
        ) : (
          <div className="mx-auto max-w-xl">
            <AuthPanel labels={dictionary.auth} />
          </div>
        )}
      </Container>
    </>
  );
}
