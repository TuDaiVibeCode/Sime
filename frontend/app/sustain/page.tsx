import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, PageHeader } from '@/components/ui';
import SustainPanel from '@/components/SustainPanel';
import { getRequestDictionary } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const { dictionary } = await getRequestDictionary();
  return {
    title: dictionary.toolPages.sustain.metaTitle,
    description: dictionary.toolPages.sustain.description,
  };
}

export default async function SustainPage() {
  const { dictionary } = await getRequestDictionary();
  const copy = dictionary.toolPages.sustain;
  return (
    <>
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        lead={copy.lead}
      />
      <Container className="py-16">
        <SustainPanel />
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted">
          {copy.note}{' '}
          <Link href="/study/breath" className="text-accent hover:underline">
            {copy.link}
          </Link>
          . {copy.suffix}{' '}
          <Link href="/lessons/breath-support" className="text-accent hover:underline">
            {copy.secondLink}
          </Link>
          .
        </p>
      </Container>
    </>
  );
}
