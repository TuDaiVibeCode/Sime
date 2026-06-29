import { NextResponse } from 'next/server';
import { getSubjects } from '@/lib/api';
import { getRequestLocale } from '@/lib/i18n-server';

// Backend-for-frontend proxy: lets client components fetch lessons without
// learning the backend origin (which stays a server-only env var).
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const subjects = await getSubjects(await getRequestLocale());
    return NextResponse.json({ subjects, tracks: subjects });
  } catch {
    return NextResponse.json(
      { error: 'Failed to load lessons from the backend.' },
      { status: 502 }
    );
  }
}
