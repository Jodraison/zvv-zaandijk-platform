/**
 * Minimal build-safe route body for T-02-01 stubs.
 * Not a dashboard — engines land in later WPs.
 */
export function AcademyRouteStub({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-2 px-4 py-8 md:px-0">
      <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">
        {title}
      </h1>
      <p className="text-sm text-zvv-muted">{description}</p>
    </div>
  );
}
