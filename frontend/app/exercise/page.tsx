import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, PageHeader } from '@/components/ui';
import VowelExercisePanel from '@/components/VowelExercisePanel';
import { getRequestDictionary } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const { dictionary } = await getRequestDictionary();
  return {
    title: dictionary.toolPages.exercise.metaTitle,
    description: dictionary.toolPages.exercise.description,
  };
}

export default async function ExercisePage() {
  const { dictionary } = await getRequestDictionary();
  const copy = dictionary.toolPages.exercise;
  return (
    <>
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        lead={copy.lead}
      />
      <Container className="py-16">
        <VowelExercisePanel />
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted">
          {copy.note}{' '}
          <Link href="/study/resonance-vowels" className="text-accent hover:underline">
            {copy.link}
          </Link>
          .
        </p>
      </Container>
    </>
  );
}
