import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'sime-frontend',
    timestamp: new Date().toISOString(),
  });
}
