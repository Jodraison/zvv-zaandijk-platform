import Link from "next/link";
import { AcademyPositionBadge } from "@/components/academy/academy-position-badge";
import { academyRoutes } from "@/lib/academy/routes";
import { cn } from "@/lib/utils";

/**
 * C-A01 AppHeader — three zones (T-01-02):
 * 1 Positie badge · 2 Zoek · 3 Profiel/Rol
 * RoleMenu gating = T-01-04. Bottom tabs = T-01-03.
 */
export function AcademyAppHeader({
  positionAbbrev,
  positionNameNl,
  profileLabel = "Profiel",
}: {
  positionAbbrev: string;
  positionNameNl: string;
  profileLabel?: string;
}) {
  return (
    <header
      className="sticky top-0 z-40 border-b border-zvv-border bg-white"
      data-academy-component="C-A01"
    >
      <div className="mx-auto flex max-w-[100rem] items-center justify-between gap-3 px-4 py-3 md:px-8">
        <AcademyPositionBadge abbrev={positionAbbrev} nameNl={positionNameNl} />

        <nav className="flex items-center gap-2" aria-label="Academy snelle acties">
          <Link
            href={academyRoutes.zoek}
            className={cn(
              "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-zvv-border",
              "bg-white px-3 text-sm font-semibold text-zvv-ink hover:border-zvv-primary hover:text-zvv-primary",
            )}
            aria-label="Zoeken"
          >
            <span aria-hidden>🔍</span>
          </Link>

          <button
            type="button"
            className={cn(
              "inline-flex min-h-11 items-center rounded-lg border border-zvv-border",
              "bg-white px-3 text-sm font-semibold text-zvv-ink",
            )}
            aria-label="Profiel en rol"
            aria-haspopup="menu"
            aria-expanded={false}
            disabled
            title="Rolmenu volgt in T-01-04"
          >
            {profileLabel}
          </button>
        </nav>
      </div>
    </header>
  );
}
