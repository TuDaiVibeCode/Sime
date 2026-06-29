import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, PageHeader } from '@/components/ui';
import TransposePanel from '@/components/TransposePanel';
import { getRequestDictionary } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const { dictionary } = await getRequestDictionary();
  return {
    title: dictionary.toolPages.transpose.metaTitle,
    description: dictionary.toolPages.transpose.description,
  };
}

export default async function TransposePage() {
  const { dictionary } = await getRequestDictionary();
  const copy = dictionary.toolPages.transpose;
  return (
    <>
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        lead={copy.lead}
      />
      <Container className="py-16">
        <TransposePanel />
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted">
          {copy.note}{' '}
          <Link href="/study/transpose" className="text-accent hover:underline">
            {copy.link}
          </Link>{' '}
          {copy.suffix}
        </p>
      </Container>
    </>
  );
}
