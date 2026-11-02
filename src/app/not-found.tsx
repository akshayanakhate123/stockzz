import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-6xl font-extrabold text-brand">404</p>
      <h1 className="mt-3 text-2xl font-extrabold">This page doesn't exist</h1>
      <p className="mt-2 text-muted">The link may be out of date. Your progress is safe.</p>
      <div className="mt-6 flex justify-center gap-3">
        <LinkButton href="/">Go home</LinkButton>
        <LinkButton href="/learn" variant="outline">
          Browse lessons
        </LinkButton>
      </div>
    </div>
  );
}
