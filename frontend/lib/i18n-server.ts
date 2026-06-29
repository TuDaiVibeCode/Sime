import { cookies, headers } from 'next/headers';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  getDictionary,
  isLocale,
  pickLocaleFromAcceptLanguage,
  type Dictionary,
  type Locale,
} from './i18n';

export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;

  const headersList = await headers();
  return pickLocaleFromAcceptLanguage(headersList.get('accept-language'));
}

export async function getRequestDictionary(): Promise<{
  locale: Locale;
  dictionary: Dictionary;
}> {
  const locale = await getRequestLocale();
  return { locale, dictionary: getDictionary(locale ?? DEFAULT_LOCALE) };
}
