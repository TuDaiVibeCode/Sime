'use client';

import { Container, btnPrimary } from '@/components/ui';

export default function LessonsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Container className="py-28 text-center">
      <h1 className="text-3xl font-extrabold">We could not load the lessons.</h1>
      <p className="mx-auto mt-4 max-w-md text-muted">
        The lesson service did not respond. Make sure the backend is running, then try again.
      </p>
      <button type="button" onClick={reset} className={`${btnPrimary} mt-8`}>
        Try again
      </button>
    </Container>
  );
}
