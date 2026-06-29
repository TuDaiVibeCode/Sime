import { NextResponse, type NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/backendProxy';

export const dynamic = 'force-dynamic';

// Job ids are UUIDs. Validate before building the backend path so user input
// can never inject extra path segments or query into the proxied URL.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.json({ error: 'Invalid job id.' }, { status: 400 });
  }
  return proxyBackend(request, `/api/analysis/jobs/${id}`);
}
