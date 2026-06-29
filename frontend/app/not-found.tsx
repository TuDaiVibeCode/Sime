import { Container, CTALink } from '@/components/ui';

export default function NotFound() {
  return (
    <Container className="py-32 text-center">
      <p className="text-sm font-semibold uppercase text-accent">404</p>
      <h1 className="mt-3 text-4xl font-extrabold">This page is off-key.</h1>
      <p className="mx-auto mt-4 max-w-md text-muted">
        We could not find what you were looking for. Let us get you back to your voice.
      </p>
      <div className="mt-8 flex justify-center">
        <CTALink href="/">Back home</CTALink>
      </div>
    </Container>
  );
}
