import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, PageHeader } from '@/components/ui';
import EarTrainingPanel from '@/components/EarTrainingPanel';
import { getRequestDictionary } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const { dictionary } = await getRequestDictionary();
  return {
    title: dictionary.toolPages.ear.metaTitle,
    description: dictionary.toolPages.ear.description,
  };
}

export default async function EarTrainingPage() {
  const { dictionary } = await getRequestDictionary();
  const copy = dictionary.toolPages.ear;
  return (
    <>
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        lead={copy.lead}
      />
      <Container className="py-16">
        <EarTrainingPanel />
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted">
          {copy.note}{' '}
          <Link href="/pitch-test" className="text-accent hover:underline">
            {copy.link}
          </Link>{' '}
          {copy.suffix}{' '}
          <Link href="/lessons/pitch-matching" className="text-accent hover:underline">
            {copy.secondLink}
          </Link>
          .
        </p>
      </Container>
    </>
  );
}
