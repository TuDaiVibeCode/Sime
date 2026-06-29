import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, ArrowRight, BookOpen } from '@phosphor-icons/react/dist/ssr';
import { Container, PageHeader } from '@/components/ui';
import { studyArticles, studyCategoryOrder } from '@/lib/vocalStudy';
import { getRequestDictionary } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const { dictionary } = await getRequestDictionary();
  return {
    title: dictionary.toolPages.study.metaTitle,
    description: dictionary.toolPages.study.description,
  };
}

export default async function StudyPage() {
  const { dictionary } = await getRequestDictionary();
  const copy = dictionary.toolPages.study;
  return (
    <>
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        lead={copy.lead}
      />
      <Container className="py-16">
        <div className="space-y-14">
          {studyCategoryOrder.map((category) => {
            const articles = studyArticles.filter((a) => a.category === category);
            if (!articles.length) return null;
            return (
              <section key={category} aria-labelledby={`cat-${category}`}>
                <h2
                  id={`cat-${category}`}
                  className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-accent"
                >
                  <BookOpen size={16} aria-hidden /> {category}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {articles.map((article) => (
                    <Link
                      key={article.slug}
                      href={`/study/${article.slug}`}
                      className="group flex flex-col rounded-2xl border border-white/10 bg-surface p-6 transition hover:border-accent/40 hover:bg-surface2"
                    >
                      <h3 className="flex items-center gap-2 text-lg font-bold">
                        {article.title}
                        <ArrowRight
                          size={16}
                          className="opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100"
                          aria-hidden
                        />
                      </h3>
                      <p className="mt-2 grow text-sm text-muted">{article.summary}</p>
                      <p className="mt-4 flex items-center gap-1.5 text-xs text-faint">
                        <Clock size={13} aria-hidden /> {article.readMin} {copy.minRead}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </Container>
    </>
  );
}
