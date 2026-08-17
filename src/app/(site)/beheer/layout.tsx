import { requireAdmin } from "@/lib/auth/require-admin";
import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { BeheerShell } from "@/components/admin/shell/beheer-shell";
import { resolveAuthContext, roleHasCapability, type Capability } from "@/lib/auth/capabilities";

export default async function BeheerLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin({ loginRedirect: "/login?next=%2Fbeheer", forbiddenRedirect: "/" });
  const db = await readDb();
  const seasonId = await readResolvedSeasonId(db);
  const auth = await resolveAuthContext();
  const can = (cap: Capability) => !!auth && roleHasCapability(auth.role, cap);

  return (
    <BeheerShell
      seasonId={seasonId}
      showSeasons={can("manage_seasons")}
      showOps={can("view_audit") || can("system_admin")}
      roleLabel={auth ? (auth.role === "owner" ? "Hoofdbeheer" : "Teambeheer") : null}
    >
      {children}
    </BeheerShell>
  );
}
