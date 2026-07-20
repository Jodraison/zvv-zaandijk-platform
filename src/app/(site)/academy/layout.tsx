import { requireAcademyAccess } from "@/lib/academy/require-academy-access";
import { AcademyAppHeader } from "@/components/academy/academy-app-header";
import { AcademyBottomTabBar } from "@/components/academy/academy-bottom-tab-bar";
import { AcademyShellMain } from "@/components/academy/academy-shell-main";

/**
 * Academy shell: auth (T-01-01) · header (T-01-02) · bottom tabs (T-01-03).
 */
export default async function AcademyMountLayout({ children }: { children: React.ReactNode }) {
  await requireAcademyAccess();

  return (
    <div className="relative flex min-h-[50vh] flex-col">
      <AcademyAppHeader positionAbbrev="—" positionNameNl="Positie nog niet gekozen" />
      <AcademyShellMain>{children}</AcademyShellMain>
      <AcademyBottomTabBar />
    </div>
  );
}
