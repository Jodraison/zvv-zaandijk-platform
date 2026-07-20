import Link from "next/link";
import { academyRoutes } from "@/lib/academy/routes";
import { cn } from "@/lib/utils";

/**
 * C-A05 PositionBadge — header zone 1 (T-01-02).
 * Switcher sheet = S-02 / T-04-07 — not this task.
 */
export function AcademyPositionBadge({
  abbrev,
  nameNl,
}: {
  abbrev: string;
  nameNl: string;
}) {
  return (
    <Link
      href={academyRoutes.positie}
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center gap-1 rounded-lg border border-zvv-border",
        "bg-zvv-card-mid px-3 py-2 text-sm font-semibold text-zvv-ink",
        "hover:border-zvv-primary hover:text-zvv-primary",
      )}
      aria-label={`Positie ${nameNl}`}
    >
      <span aria-hidden>{abbrev}</span>
      <span className="text-xs font-medium text-zvv-muted" aria-hidden>
        ▼
      </span>
    </Link>
  );
}
