import type { Request, RequestHandler } from 'express';

export const LOCALES = ['en', 'vi'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'sime_locale';

const viMessages: Record<string, string> = {
  'Not found': 'Không tìm thấy',
  'Validation failed': 'Dữ liệu không hợp lệ',
  'Internal server error': 'Lỗi máy chủ nội bộ',
  'Too many requests, please slow down.': 'Quá nhiều yêu cầu, vui lòng chậm lại.',
  'Too many attempts, please try again later.': 'Quá nhiều lần thử, vui lòng thử lại sau.',
  'Authentication required.': 'Cần đăng nhập.',
  'Authentication is not configured. Set JWT_SECRET first.':
    'Chưa cấu hình xác thực. Hãy đặt JWT_SECRET trước.',
  'Invalid email or password.': 'Email hoặc mật khẩu không đúng.',
  'An account with this email already exists.': 'Đã có tài khoản dùng email này.',
  'Database is not configured. Set DATABASE_URL first.':
    'Chưa cấu hình cơ sở dữ liệu. Hãy đặt DATABASE_URL trước.',
  'Analysis job not found': 'Không tìm thấy job phân tích',
  'Worker authentication is not configured.': 'Chưa cấu hình xác thực worker.',
  'Worker authentication required.': 'Cần xác thực worker.',
  'Lesson not found': 'Không tìm thấy bài học',
  'The coaching service timed out.': 'Dịch vụ huấn luyện đã hết thời gian chờ.',
  'The AI coach is not configured. Add OPENAI_API_KEY or GEMINI_API_KEY to backend/.env and restart the backend.':
    'Chưa cấu hình huấn luyện viên AI. Hãy thêm OPENAI_API_KEY hoặc GEMINI_API_KEY vào backend/.env và khởi động lại backend.',
  'Not enough stable notes to determine a safe vocal range.':
    'Chưa đủ nốt ổn định để xác định quãng giọng an toàn.',
  'pgvector is not available. Run the database migrations first.':
    'pgvector chưa khả dụng. Hãy chạy migration cơ sở dữ liệu trước.',
  'Voice profile not found': 'Không tìm thấy hồ sơ giọng hát',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function normalizeLocale(value: unknown): Locale {
  if (isLocale(value)) return value;
  if (typeof value === 'string') {
    const language = value.toLowerCase().split(/[-_]/)[0];
    if (isLocale(language)) return language;
  }
  return DEFAULT_LOCALE;
}

function localeFromAcceptLanguage(header: string | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  for (const part of header.split(',')) {
    const locale = normalizeLocale(part.trim().split(';')[0]);
    if (locale !== DEFAULT_LOCALE || part.toLowerCase().startsWith(DEFAULT_LOCALE)) {
      return locale;
    }
  }
  return DEFAULT_LOCALE;
}

export function detectLocale(req: Request): Locale {
  const queryLocale = typeof req.query.lang === 'string' ? req.query.lang : undefined;
  if (isLocale(queryLocale)) return queryLocale;

  const headerLocale = req.header('X-Sime-Locale');
  if (isLocale(headerLocale)) return headerLocale;

  const cookieLocale = req.cookies?.[LOCALE_COOKIE];
  if (isLocale(cookieLocale)) return cookieLocale;

  return localeFromAcceptLanguage(req.header('Accept-Language'));
}

export function translateMessage(message: string, locale: Locale) {
  if (locale === 'vi') return viMessages[message] ?? message;
  return message;
}

export const localeMiddleware: RequestHandler = (req, res, next) => {
  req.locale = detectLocale(req);
  res.setHeader('Content-Language', req.locale);
  next();
};
