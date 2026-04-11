import { cookies } from "next/headers";
import Link from "next/link";
import { readDb } from "@/lib/data/repository";
import { resolveSeasonId } from "@/lib/season";
import { GlassCard } from "@/components/layout/glass-card";
import { Badge } from "@/components/layout/badge";
import { selectSeasonFormAction } from "@/actions/season";
import { isCurrentUserAdmin } from "@/lib/auth/viewer";

export default async function SeizoenenPage() {
  const db = await readDb();
  const cookieSeason = (await cookies()).get("zvv_season_id")?.value;
  const current = resolveSeasonId(db, cookieSeason);
  const isAdmin = await isCurrentUserAdmin();

  return (
    <div className="space-y-8">
      <header>
        <p className="club-page-eyebrow">Seizoenen</p>
        <h1 className="mt-2 font-[family-name:var(--font-bebas)] text-5xl tracking-wide text-zvv-ink md:text-6xl">Tijdlijn</h1>
        <p className="mt-2 max-w-xl text-sm text-zvv-muted">
          Kies het seizoen dat je wilt volgen. De switcher in de header gebruikt dezelfde voorkeur (cookie + URL).
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {db.seasons.map((s) => {
          const active = s.id === current;
          return (
            <GlassCard key={s.id} glow={active} className={active ? "border-zvv-primary/40" : ""}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge tone={s.is_active ? "gold" : "muted"}>{s.is_active ? "Actief in DB" : "Archief"}</Badge>
                  <h2 className="mt-3 text-2xl font-bold text-zvv-ink">{s.name}</h2>
                  <p className="mt-1 text-sm text-zvv-muted">
                    {s.starts_on} → {s.ends_on}
                  </p>
                </div>
              </div>
              <form className="mt-6" action={selectSeasonFormAction}>
                <input type="hidden" name="season_id" value={s.id} />
                <button
                  type="submit"
                  className="club-btn-primary w-full py-2.5 text-sm disabled:opacity-40"
                  disabled={active}
                >
                  {active ? "Huidige selectie" : "Maak dit seizoen actief in jouw sessie"}
                </button>
              </form>
              <Link
                href={`/?season=${encodeURIComponent(s.id)}`}
                className="mt-3 block text-center text-sm font-semibold text-zvv-primary hover:text-zvv-primary-hover"
              >
                Open met URL →
              </Link>
            </GlassCard>
          );
        })}
      </div>

      {isAdmin ? (
        <GlassCard>
          <p className="text-sm text-zvv-muted">
            Seizoenen beheren (aanmaken / actief zetten in dataset) kan via{" "}
            <Link href="/beheer/seizoenen" className="font-semibold text-zvv-primary hover:text-zvv-primary-hover">
              Beheer → Seizoenen
            </Link>
            .
          </p>
        </GlassCard>
      ) : null}
    </div>
  );
}
