import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from './api';

export async function proxyBackend(request: NextRequest, path: string) {
  if (!path.startsWith('/')) {
    return NextResponse.json({ error: 'Invalid backend path.' }, { status: 500 });
  }

  try {
    const headers = new Headers();
    const contentType = request.headers.get('content-type');
    const cookie = request.headers.get('cookie');
    if (contentType) headers.set('content-type', contentType);
    if (cookie) headers.set('cookie', cookie);

    const hasBody = !['GET', 'HEAD'].includes(request.method);
    const backendResponse = await fetch(`${getBackendUrl()}${path}`, {
      method: request.method,
      headers,
      body: hasBody ? await request.text() : undefined,
      cache: 'no-store',
    });

    const body = backendResponse.status === 204 ? null : await backendResponse.text();
    const response = new NextResponse(body, {
      status: backendResponse.status,
      headers: {
        'content-type': backendResponse.headers.get('content-type') ?? 'application/json',
      },
    });

    const setCookie = backendResponse.headers.get('set-cookie');
    if (setCookie) response.headers.set('set-cookie', setCookie);
    return response;
  } catch {
    return NextResponse.json({ error: 'Backend is unavailable.' }, { status: 502 });
  }
}
