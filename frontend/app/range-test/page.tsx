import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, PageHeader } from '@/components/ui';
import RangeTestPanel from '@/components/RangeTestPanel';
import { getRequestDictionary } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const { dictionary } = await getRequestDictionary();
  return {
    title: dictionary.home.runRangeTest,
    description: dictionary.rangeTest.description,
  };
}

export default async function RangeTestPage() {
  const { dictionary } = await getRequestDictionary();
  return (
    <>
      <PageHeader
        eyebrow={dictionary.rangeTest.eyebrow}
        title={dictionary.rangeTest.title}
        lead={dictionary.rangeTest.lead}
      />
      <Container className="py-16">
        <RangeTestPanel />
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted">
          {dictionary.rangeTest.readFirst}{' '}
          <Link href="/study/voice-types" className="text-accent hover:underline">
            {dictionary.rangeTest.guide}
          </Link>{' '}
          {dictionary.rangeTest.handbookFirst}
        </p>
      </Container>
    </>
  );
}
