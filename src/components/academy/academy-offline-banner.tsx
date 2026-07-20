import {
  ACADEMY_OFFLINE_BANNER_COPY,
} from "@/lib/academy/offline-flag";
import { cn } from "@/lib/utils";

/**
 * C-C25 OfflineBanner — sticky under AppHeader when offline flag is on (T-01-05).
 * Slot only: no cache engine.
 */
export function AcademyOfflineBanner({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-academy-component="C-C25"
      data-academy-offline-banner=""
      className={cn(
        "border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm font-semibold text-amber-950 md:px-8",
        className,
      )}
    >
      {ACADEMY_OFFLINE_BANNER_COPY}
    </div>
  );
}
