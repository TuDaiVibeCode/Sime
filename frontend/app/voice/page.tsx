import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Microphone,
  Waveform,
  ArrowsDownUp,
  GraduationCap,
  WarningCircle,
  Sparkle,
  Users,
  ArrowRight,
  MusicNotes,
  Path,
} from '@phosphor-icons/react/dist/ssr';
import { getCurrentUser, getLatestVoiceProfile, getSubjects } from '@/lib/api';
import { Container, PageHeader, btnPrimary, btnLine } from '@/components/ui';
import {
  voiceTypes,
  personalizeForProfile,
  type VoiceTypeProfile,
} from '@/lib/voiceTypes';
import { getRequestLocale } from '@/lib/i18n-server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your voice type',
  description:
    'Find your voice type (Fach) and get guidance built for it: your range, passaggio, the lessons to prioritise, common pitfalls, and singers who share your voice.',
};

type LessonLite = { title: string; durationMin: number };

export default async function VoicePage() {
  const locale = await getRequestLocale();
  const user = await getCurrentUser();
  const [profile, subjects] = await Promise.all([
    user ? getLatestVoiceProfile() : Promise.resolve(null),
    getSubjects(locale).catch(() => []),
  ]);

  const lessonMap = new Map<string, LessonLite>();
  for (const subject of subjects) {
    for (const lecture of subject.lectures) {
      for (const lesson of lecture.lessons) {
        lessonMap.set(lesson.id, { title: lesson.title, durationMin: lesson.durationMin });
      }
    }
  }

  const personal = profile ? personalizeForProfile(profile) : null;

  return (
    <>
      <PageHeader
        eyebrow="Your voice"
        title={personal ? `You sing as a ${personal.fach.name}.` : 'Find your voice type.'}
        lead={
          personal
            ? 'Here is what that means for your practice: your range and bridges, the lessons to lead with, the traps to avoid, and singers who share your voice.'
            : 'Every voice has a type (a Fach): a natural range and colour that decides which lessons, keys, and habits will serve you best. Map your range to unlock guidance built for your voice.'
        }
      />

      <Container className="py-14">
        {personal ? (
          <PersonalSection personal={personal} voiceColor={profile!.voiceColor} lessonMap={lessonMap} />
        ) : (
          <NoProfileSection signedIn={Boolean(user)} />
        )}

        {/* Reference: all voice types */}
        <section className="mt-16">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Users size={24} className="text-accent" aria-hidden /> Every voice type
          </h2>
          <p className="mt-2 max-w-2xl text-muted">
            The full set, lowest to highest. Ranges and bridges are typical guides; your own
            measured range is what decides your type.
          </p>
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {voiceTypes.map((v) => (
              <FachCard key={v.key} v={v} highlight={personal?.fach.key === v.key} />
            ))}
          </div>
          <p className="mt-6 text-xs text-faint">
            Grounded in standard vocal pedagogy (Richard Miller, James McKinney, NATS science-informed
            pedagogy) and the project reference. Sime measures pitch and range, not timbre, so your
            type is set from your range; colour (Kim or Tho) is a guide, not a verdict.
          </p>
        </section>
      </Container>
    </>
  );
}

function PersonalSection({
  personal,
  voiceColor,
  lessonMap,
}: {
  personal: NonNullable<ReturnType<typeof personalizeForProfile>>;
  voiceColor: string;
  lessonMap: Map<string, LessonLite>;
}) {
  const { fach } = personal;
  const comparison =
    personal.rangeComparison === 'narrower'
      ? `Your measured range (${personal.measuredSemitones} semitones) is narrower than the typical ${personal.typicalSemitones} for a ${fach.name}. That is normal early on: range grows as breath and the bridges free up.`
      : personal.rangeComparison === 'wider'
        ? `Your measured range (${personal.measuredSemitones} semitones) is wider than the typical ${personal.typicalSemitones} for a ${fach.name}. Strong foundation: focus now on evenness and control across all of it.`
        : `Your measured range (${personal.measuredSemitones} semitones) is right around the typical ${personal.typicalSemitones} for a ${fach.name}.`;

  const recommended = fach.recommendedLessons
    .map((id) => ({ id, lesson: lessonMap.get(id) }))
    .filter((x): x is { id: string; lesson: LessonLite } => Boolean(x.lesson));

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      {/* Left: your snapshot + guide */}
      <div className="space-y-5">
        <div className="rounded-2xl border border-accent/25 bg-accent/[0.06] p-6">
          <p className="text-xs font-semibold uppercase text-accent">Your voice snapshot</p>
          <h2 className="mt-2 text-2xl font-bold">{fach.name}</h2>
          <p className="mt-2 text-muted">{fach.description}</p>
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-4">
            <Fact label="Your range" value={`${personal.measuredLow}-${personal.measuredHigh}`} />
            <Fact label="Typical" value={`${fach.rangeLow}-${fach.rangeHigh}`} />
            <Fact label="Colour" value={shortColor(voiceColor)} />
            <Fact label="Stage" value={personal.stageLabel} />
          </dl>
          <p className="mt-4 text-sm text-muted">{comparison}</p>
        </div>

        <InfoCard icon={Path} title="Your bridges (passaggio)">
          <p className="text-sm text-muted">
            Sweet spot (tessitura): <strong className="text-text">{fach.tessituraLow} to {fach.tessituraHigh}</strong>.
            First bridge near <strong className="text-text">{fach.primoPassaggio}</strong>, second near{' '}
            <strong className="text-text">{fach.secondoPassaggio}</strong>.
          </p>
          <p className="mt-3 text-sm text-muted">{personal.passaggioFocus}</p>
        </InfoCard>

        <InfoCard icon={Sparkle} title="What to work on for your voice">
          <ul className="space-y-2.5 text-sm text-muted">
            {fach.focus.map((f, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
        </InfoCard>

        <InfoCard icon={WarningCircle} title="Traps for your voice type">
          <ul className="space-y-2.5 text-sm text-muted">
            {fach.pitfalls.map((p, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        </InfoCard>
      </div>

      {/* Right: lessons, exemplars, tools */}
      <div className="space-y-5">
        <InfoCard icon={GraduationCap} title="Lessons to lead with">
          <p className="text-sm text-muted">In priority order for a {fach.name}.</p>
          <ol className="mt-4 space-y-2.5">
            {recommended.map(({ id, lesson }, i) => (
              <li key={id}>
                <Link
                  href={`/lessons/${id}`}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-surface px-4 py-3 transition hover:border-accent/40 hover:bg-surface2"
                >
                  <span className="flex items-center gap-3 text-sm font-medium">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/15 text-xs font-bold text-accent ring-1 ring-accent/25">
                      {i + 1}
                    </span>
                    {lesson.title}
                  </span>
                  <ArrowRight
                    size={15}
                    className="shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ol>
        </InfoCard>

        <InfoCard icon={MusicNotes} title="Voices like yours">
          <p className="text-sm text-muted">{fach.repertoire}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {fach.exemplars.map((name) => (
              <span
                key={name}
                className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-text"
              >
                {name}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-faint">{fach.colorNote}</p>
        </InfoCard>

        <div className="rounded-2xl border border-white/10 bg-bg2 p-5">
          <p className="text-sm font-semibold">Keep your profile fresh</p>
          <p className="mt-1 text-sm text-muted">
            Re-map after a few weeks of training. Your range and bridges move as you develop.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link href="/range-test" className={btnLine}>
              <Waveform size={17} aria-hidden /> Re-map range
            </Link>
            <Link href="/transpose" className={btnLine}>
              <ArrowsDownUp size={17} aria-hidden /> Find a song key
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function NoProfileSection({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-surface p-7">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent ring-1 ring-accent/25">
          <Microphone size={24} aria-hidden />
        </span>
        <div>
          <h2 className="text-xl font-bold">Map your range to find your type</h2>
          <p className="mt-2 max-w-xl text-muted">
            The range test glides from your lowest comfortable note to your highest, then classifies
            your voice type and bridges. {signedIn
              ? 'It saves to your profile so every page can tailor to your voice.'
              : 'You can run it now; sign in to save it to your profile so the app can personalise to you.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/range-test" className={btnPrimary}>
              <Waveform size={18} aria-hidden /> Run the range test
            </Link>
            {!signedIn ? (
              <Link href="/account" className={btnLine}>
                Sign in to save
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function FachCard({ v, highlight }: { v: VoiceTypeProfile; highlight?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        highlight ? 'border-accent/40 bg-accent/[0.06]' : 'border-white/10 bg-surface'
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-bold">{v.name}</h3>
        <span className="text-sm font-semibold tabular-nums text-accent">
          {v.rangeLow}-{v.rangeHigh}
        </span>
      </div>
      <p className="mt-1 text-xs uppercase tracking-wide text-faint">
        {v.group === 'male' ? 'Male' : v.group === 'female' ? 'Female' : 'Any'} · bridges{' '}
        {v.primoPassaggio} / {v.secondoPassaggio}
      </p>
      <p className="mt-3 text-sm text-muted">{v.blurb}</p>
      <p className="mt-3 text-xs text-faint">
        {highlight ? 'Your type. ' : ''}Like: {v.exemplars.slice(0, 3).join(', ')}
      </p>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Path;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-surface p-6">
      <h3 className="flex items-center gap-2 text-base font-bold">
        <Icon size={20} className="text-accent" aria-hidden /> {title}
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-faint">{label}</dt>
      <dd className="mt-1 font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

// The backend stores colour as "Kim - bright..." or "Tho - warm..."; show the short tag.
function shortColor(voiceColor: string): string {
  if (!voiceColor) return '-';
  if (voiceColor.toLowerCase().startsWith('kim')) return 'Kim (bright)';
  if (voiceColor.toLowerCase().startsWith('tho')) return 'Tho (warm)';
  return voiceColor.split(/[-(]/)[0].trim() || voiceColor;
}
