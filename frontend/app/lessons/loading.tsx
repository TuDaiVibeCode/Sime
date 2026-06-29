import { Container } from '@/components/ui';

export default function LessonsLoading() {
  return (
    <Container className="py-24">
      <div className="h-9 w-72 animate-pulse rounded-lg bg-surface2" />
      <div className="mt-10 space-y-10">
        {[0, 1, 2].map((s) => (
          <div key={s}>
            <div className="mb-5 h-6 w-40 animate-pulse rounded bg-surface2" />
            <div className="grid gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3].map((c) => (
                <div key={c} className="h-[68px] animate-pulse rounded-xl bg-surface" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
