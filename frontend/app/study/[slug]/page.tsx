import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Info } from '@phosphor-icons/react/dist/ssr';
import { Container } from '@/components/ui';
import { studyArticles, getStudyArticle } from '@/lib/vocalStudy';

export function generateStaticParams() {
  return studyArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getStudyArticle(slug);
  if (!article) return { title: 'Article not found' };
  return { title: article.title, description: article.summary };
}

export default async function StudyArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getStudyArticle(slug);
  if (!article) notFound();

  return (
    <Container className="py-16">
      <Link href="/study" className="inline-flex items-center gap-2 text-sm text-muted hover:text-text">
        <ArrowLeft size={16} aria-hidden /> All study
      </Link>

      <article className="mt-6 max-w-3xl">
        <p className="text-xs font-semibold uppercase text-accent">{article.category}</p>
        <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">{article.title}</h1>
        <p className="mt-4 flex items-center gap-1.5 text-muted">
          <Clock size={17} aria-hidden /> {article.readMin} min read
        </p>
        <p className="mt-6 text-lg text-muted">{article.summary}</p>

        <div className="mt-10 space-y-10">
          {article.sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-xl font-bold">{section.heading}</h2>

              {section.body?.map((p, j) => (
                <p key={j} className="mt-3 text-muted">
                  {p}
                </p>
              ))}

              {section.bullets ? (
                <ul className="mt-4 space-y-2.5 text-muted">
                  {section.bullets.map((b, j) => (
                    <li key={j} className="flex gap-2.5">
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                        aria-hidden
                      />
                      {b}
                    </li>
                  ))}
                </ul>
              ) : null}

              {section.table ? (
                <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-bg2">
                        {section.table.headers.map((h, j) => (
                          <th key={j} className="px-4 py-3 font-semibold text-text">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.rows.map((row, r) => (
                        <tr key={r} className="border-t border-white/10">
                          {row.map((cell, c) => (
                            <td
                              key={c}
                              className={c === 0 ? 'px-4 py-3 font-medium text-text' : 'px-4 py-3 text-muted'}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {section.note ? (
                <p className="mt-5 flex items-start gap-2.5 rounded-2xl border border-accent/25 bg-accent/[0.06] px-4 py-3 text-sm text-muted">
                  <Info size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                  <span>{section.note}</span>
                </p>
              ) : null}
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-3 border-t border-white/10 pt-8 text-sm">
          <Link href="/study" className="font-semibold text-accent">
            More study articles
          </Link>
          <span className="text-faint">·</span>
          <Link href="/lessons" className="font-semibold text-accent">
            Back to lessons
          </Link>
        </div>
      </article>
    </Container>
  );
}
