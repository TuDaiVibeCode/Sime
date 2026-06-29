import './globals.css';
import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import { SITE } from '@/lib/site';
import { getRequestDictionary } from '@/lib/i18n-server';

const geist = Geist({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-geist',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const { dictionary } = await getRequestDictionary();
  return {
    metadataBase: new URL(SITE.url),
    title: {
      default: `${SITE.name} - ${dictionary.site.tagline}`,
      template: `%s · ${SITE.name}`,
    },
    description: dictionary.site.description,
    openGraph: {
      title: SITE.name,
      description: dictionary.site.description,
      url: SITE.url,
      siteName: SITE.name,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: SITE.name,
      description: dictionary.site.description,
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, dictionary } = await getRequestDictionary();
  return (
    <html lang={locale} className={geist.variable}>
      <body className="flex min-h-dvh flex-col md:flex-row">
        <SiteNav locale={locale} dictionary={dictionary} />
        <div className="flex flex-1 flex-col">
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter dictionary={dictionary} />
        </div>
      </body>
    </html>
  );
}

