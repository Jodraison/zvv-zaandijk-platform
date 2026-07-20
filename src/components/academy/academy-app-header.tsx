import Link from "next/link";
import { AcademyPositionBadge } from "@/components/academy/academy-position-badge";
import { AcademyRoleMenu } from "@/components/academy/academy-role-menu";
import type { AcademyRoleGrants } from "@/lib/academy/academy-role-grants";
import { academyRoutes } from "@/lib/academy/routes";
import { cn } from "@/lib/utils";

/**
 * C-A01 AppHeader — three zones (T-01-02 + T-01-04):
 * 1 Positie badge · 2 Zoek · 3 RoleMenu (C-A04)
 */
export function AcademyAppHeader({
  positionAbbrev,
  positionNameNl,
  roleGrants,
}: {
  positionAbbrev: string;
  positionNameNl: string;
  roleGrants: AcademyRoleGrants;
}) {
  return (
    <header
      className="border-b border-zvv-border bg-white"
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

          <AcademyRoleMenu grants={roleGrants} />
        </nav>
      </div>
    </header>
  );
}
