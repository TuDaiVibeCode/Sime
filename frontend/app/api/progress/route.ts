import type { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/backendProxy';

export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  return proxyBackend(request, '/api/progress');
}

export function POST(request: NextRequest) {
  return proxyBackend(request, '/api/progress');
}
