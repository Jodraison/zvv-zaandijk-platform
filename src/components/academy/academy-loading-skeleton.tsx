import { cn } from "@/lib/utils";

/**
 * C-C27 LoadingSkeleton — shared export for widget-block loading (T-01-05).
 * Skeleton per block · no spinner-only. Engines wire this in later WPs.
 */
export function AcademyLoadingSkeleton({
  blocks = 3,
  className,
}: {
  /** Number of widget-block placeholders. */
  blocks?: number;
  className?: string;
}) {
  const count = Math.max(1, Math.min(blocks, 12));

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Laden"
      data-academy-component="C-C27"
      data-academy-loading-skeleton=""
      className={cn("mx-auto max-w-lg animate-pulse space-y-3 px-4 py-6 md:px-0", className)}
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-lg bg-zvv-muted/25",
            i === 0 ? "h-10 w-full" : i % 2 === 0 ? "h-16 w-full" : "h-12 w-4/5",
          )}
        />
      ))}
      <span className="sr-only">Content wordt geladen</span>
    </div>
  );
}
