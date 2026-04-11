import { cookies } from "next/headers";
import { readDb } from "@/lib/data/repository";
import { resolveSeasonId } from "@/lib/season";
import { teamAttendanceSummary } from "@/lib/queries/training-fitness";
import { GlassCard } from "@/components/layout/glass-card";
import { AttendanceBar } from "@/components/charts/attendance-bar";
import { Badge } from "@/components/layout/badge";
import { formatDateNL } from "@/lib/utils/format-date";

export default async function TrainingPage() {
  const db = await readDb();
  const cookieSeason = (await cookies()).get("zvv_season_id")?.value;
  const seasonId = resolveSeasonId(db, cookieSeason);
  const sum = teamAttendanceSummary(db, seasonId);
  const bar = sum.bySession.map((s) => ({ label: formatDateNL(s.label), pct: s.pct }));

  return (
    <div className="space-y-8">
      <header className="club-section-surface club-reveal">
        <p className="club-page-eyebrow">Training</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(2.5rem,6vw,3.9rem)] tracking-wide text-zvv-ink">Aanwezigheid</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zvv-muted">Een helder performance-overzicht per sessie en per speelster, met focus op ritme en betrouwbaarheid.</p>
      </header>

      <GlassCard glow className="club-card-lift bg-gradient-to-br from-white to-zvv-card-mid/35">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">Sessie-opkomst</h2>
          <Badge tone="muted">{sum.sessionCount} sessies</Badge>
        </div>
        <div className="mt-6 h-[280px]">{bar.length ? <AttendanceBar data={bar} /> : <p className="text-sm text-zvv-muted">Nog geen trainingen.</p>}</div>
      </GlassCard>

      <GlassCard className="club-card-lift bg-gradient-to-br from-white to-zvv-card-mid/20">
        <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">Per speelster</h2>
        <p className="mt-1 text-sm text-zvv-muted">Aanwezigheidspercentage over alle geregistreerde sessies in dit seizoen.</p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {sum.perPlayer.map((p) => (
            <div
              key={p.player_id}
              className="flex items-center justify-between rounded-2xl border border-zvv-border bg-white px-4 py-3 shadow-sm transition-[transform,border-color] duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-zvv-primary/25"
            >
              <div>
                <div className="font-semibold text-zvv-ink">
                  #{p.shirt_number} {p.name}
                </div>
                <div className="text-xs text-zvv-muted">
                  {p.present}/{p.total} aanwezig
                </div>
              </div>
              <div className="text-2xl font-black text-zvv-primary">{p.pct}%</div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
