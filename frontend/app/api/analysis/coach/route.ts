import type { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/backendProxy';

export const dynamic = 'force-dynamic';

// Auth required by the backend; proxyBackend forwards the session cookie.
export function POST(request: NextRequest) {
  return proxyBackend(request, '/api/analysis/coach');
}
