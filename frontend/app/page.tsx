import Link from 'next/link';
import {
  BookOpen,
  CheckCircle,
  GraduationCap,
  Microphone,
  PlayCircle,
  SignIn,
  Timer,
} from '@phosphor-icons/react/dist/ssr';
import {
  getCurrentUser,
  getProgress,
  getLatestVoiceProfile,
  getSubjects,
  type Subject,
} from '@/lib/api';
import { Container, Card, btnLine, btnPrimary, PageHeader } from '@/components/ui';
import RangeTestPanel from '@/components/RangeTestPanel';
import { getRequestDictionary } from '@/lib/i18n-server';
import type { Dictionary } from '@/lib/i18n';

// Personalized to the signed-in session, so never cache.
export const dynamic = 'force-dynamic';

type FlatLesson = {
  id: string;
  title: string;
  durationMin: number;
  subjectName: string;
  lectureTitle: string;
};

function flattenLessons(subjects: Subject[]): FlatLesson[] {
  return subjects.flatMap((subject) =>
    subject.lectures.flatMap((lecture) =>
      lecture.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        durationMin: lesson.durationMin,
        subjectName: subject.name,
        lectureTitle: lecture.title,
      }))
    )
  );
}

export default async function DashboardPage() {
  const { locale, dictionary } = await getRequestDictionary();
  const user = await getCurrentUser();

  if (!user) {
    return <SignedOutHome dictionary={dictionary} />;
  }

  const [progress, profile, subjects] = await Promise.all([
    getProgress(),
    getLatestVoiceProfile(),
    getSubjects(locale),
  ]);

  if (!profile) {
    return (
      <>
        <PageHeader
          eyebrow={dictionary.rangeTest.eyebrow}
          title={dictionary.rangeTest.title}
          lead={dictionary.rangeTest.lead}
        />
        <Container className="py-16">
          <RangeTestPanel />
        </Container>
      </>
    );
  }

  const completedIds = new Set(
    progress.filter((p) => p.status === 'completed' && p.lessonId).map((p) => p.lessonId as string)
  );
  const allLessons = flattenLessons(subjects);
  const nextLesson = allLessons.find((lesson) => !completedIds.has(lesson.id)) ?? allLessons[0] ?? null;
  const completionPercent =
    allLessons.length > 0 ? Math.round((completedIds.size / allLessons.length) * 100) : 0;
  const stageLabel = dictionary.common[profile.roadmapStage] ?? profile.roadmapStage;

  return (
    <Container className="py-8 md:py-12">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="bg-surface2">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            {dictionary.home.dashboard}
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-extrabold md:text-4xl">
            {dictionary.home.welcomeBack}{user.displayName ? `, ${user.displayName}` : ''}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
            {dictionary.home.studentDashboardLead}
          </p>

          {nextLesson ? (
            <div className="mt-8 rounded-lg bg-bg2 p-5 ring-1 ring-white/10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-faint">
                    {dictionary.home.nextLesson}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">{nextLesson.title}</h2>
                  <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <GraduationCap size={16} aria-hidden />
                      {nextLesson.subjectName} · {nextLesson.lectureTitle}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Timer size={16} aria-hidden />
                      {nextLesson.durationMin} {dictionary.common.minutes}
                    </span>
                  </p>
                </div>
                <Link href={`/lessons/${nextLesson.id}`} className={btnPrimary}>
                  <PlayCircle size={18} aria-hidden />
                  {completedIds.has(nextLesson.id) ? dictionary.home.revisitLesson : dictionary.home.continue}
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-lg bg-bg2 p-5 text-sm text-muted ring-1 ring-white/10">
              {dictionary.home.lessonsLoading}
            </div>
          )}
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-faint">
            {dictionary.home.voiceProfile}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <DashboardFact label={dictionary.home.voiceType} value={profile.voiceType} />
            <DashboardFact label={dictionary.home.stage} value={stageLabel} />
            <DashboardFact
              label={dictionary.home.range}
              value={`${profile.lowestNote} - ${profile.highestNote}`}
            />
            <DashboardFact
              label={dictionary.home.span}
              value={`${profile.rangeSemitones} ${dictionary.home.semitones}`}
            />
          </div>
          <div className="mt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-text">{dictionary.home.courseProgress}</span>
              <span className="text-muted">{completionPercent}%</span>
            </div>
            <div
              className="mt-2 h-2 rounded-full bg-white/10"
              role="progressbar"
              aria-label={dictionary.home.courseProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={completionPercent}
            >
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-muted">
              {completedIds.size} / {allLessons.length} {dictionary.common.lessons}
            </p>
          </div>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <h2 className="text-xl font-bold">{dictionary.home.practiceTools}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{dictionary.home.practiceToolsLead}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <QuickLink href="/practice" icon={<Microphone size={18} aria-hidden />} label={dictionary.home.livePitchPractice} />
            <QuickLink href="/warmup" icon={<Timer size={18} aria-hidden />} label={dictionary.home.warmUp} />
            <QuickLink href="/coach" icon={<BookOpen size={18} aria-hidden />} label={dictionary.home.askCoach} />
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                {dictionary.home.curriculum}
              </p>
              <h2 className="mt-2 text-2xl font-bold">{dictionary.home.coursePlan}</h2>
            </div>
            <Link href="/lessons" className="text-sm font-semibold text-accent hover:text-accent-strong">
              {dictionary.common.allLessons}
            </Link>
          </div>

          <div className="mt-6 divide-y divide-white/10">
            {allLessons.slice(0, 8).map((lesson, index) => {
              const isCompleted = completedIds.has(lesson.id);
              const isNext = nextLesson?.id === lesson.id;
              return (
                <Link
                  key={lesson.id}
                  href={`/lessons/${lesson.id}`}
                  className="group flex items-center gap-4 py-4 transition hover:bg-white/[0.03] sm:-mx-3 sm:px-3"
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-semibold ${
                      isCompleted
                        ? 'bg-accent text-on-accent'
                        : isNext
                          ? 'bg-accent/15 text-accent ring-1 ring-accent/25'
                          : 'bg-white/5 text-muted'
                    }`}
                  >
                    {isCompleted ? <CheckCircle size={18} weight="fill" aria-hidden /> : index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-text group-hover:text-accent">
                      {lesson.title}
                    </span>
                    <span className="mt-1 block truncate text-sm text-muted">
                      {lesson.subjectName} · {lesson.lectureTitle} · {lesson.durationMin} {dictionary.common.minutes}
                    </span>
                  </span>
                  <span className="hidden text-sm font-semibold text-muted sm:block">
                    {isCompleted
                      ? dictionary.common.completed
                      : isNext
                        ? dictionary.home.continue
                        : dictionary.home.previewLesson}
                  </span>
                </Link>
              );
            })}
          </div>

          {allLessons.length === 0 ? (
            <div className="mt-6 rounded-lg border border-white/10 p-5 text-center text-sm text-muted">
              {dictionary.home.lessonsLoading}
            </div>
          ) : null}
        </Card>
      </section>
    </Container>
  );
}

function DashboardFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-bg2 p-4 ring-1 ring-white/10">
      <p className="text-xs font-semibold uppercase tracking-wider text-faint">{label}</p>
      <p className="mt-2 text-lg font-bold text-text">{value}</p>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link href={href} className={`${btnLine} justify-start px-4 py-3`}>
      {icon}
      {label}
    </Link>
  );
}

function SignedOutHome({ dictionary }: { dictionary: Dictionary }) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[680px] -translate-x-1/3 rounded-full"
        style={{
          background: 'radial-gradient(closest-side, rgba(255,184,77,0.18), transparent 72%)',
        }}
      />
      <Container className="relative py-20 md:py-28">
        <div className="max-w-xl text-center mx-auto">
          <p className="mb-3 text-xs font-semibold uppercase text-accent">
            {dictionary.home.signedOutEyebrow}
          </p>
          <h1 className="text-4xl font-extrabold md:text-5xl">{dictionary.home.signedOutTitle}</h1>
          <p className="mt-5 text-lg text-muted">
            {dictionary.home.signedOutLead}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/account" className={btnPrimary}>
              <SignIn size={18} aria-hidden /> {dictionary.home.signIn}
            </Link>
            <Link href="/lessons" className={btnLine}>
              <BookOpen size={18} aria-hidden /> {dictionary.home.browseCurriculum}
            </Link>
            <Link href="/practice" className={btnLine}>
              <Microphone size={18} aria-hidden /> {dictionary.home.tryPractice}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}


