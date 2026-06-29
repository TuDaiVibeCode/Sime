import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLesson, getLatestVoiceProfile } from '@/lib/api';
import { getLessonGuide } from '@/lib/lessonGuides';
import { getRequestDictionary } from '@/lib/i18n-server';
import { Container } from '@/components/ui';
import LessonClientView from '@/components/LessonClientView';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { locale, dictionary } = await getRequestDictionary();
  const lesson = await getLesson(id, locale);
  if (!lesson) return { title: dictionary.lessonPage.notFound };
  const guide = getLessonGuide(id);
  return {
    title: lesson.title,
    description:
      guide?.objective ??
      `A ${lesson.durationMin} minute vocal lesson in ${lesson.subjectName}, ${lesson.lectureTitle}.`,
  };
}

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { locale, dictionary } = await getRequestDictionary();
  const { id } = await params;
  const [lesson, profile] = await Promise.all([
    getLesson(id, locale),
    getLatestVoiceProfile(),
  ]);

  if (!lesson) notFound();

  const guide = getLessonGuide(lesson.id);

  return (
    <Container className="py-8">
      <LessonClientView
        lesson={lesson}
        profile={profile}
        guide={guide}
        dictionary={dictionary}
      />
    </Container>
  );
}
