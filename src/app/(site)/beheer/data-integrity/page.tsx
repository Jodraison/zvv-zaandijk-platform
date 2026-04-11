import { cookies } from "next/headers";
import { readDb } from "@/lib/data/repository";
import { resolveSeasonId } from "@/lib/season";
import { GlassCard } from "@/components/layout/glass-card";

function runIntegrityChecks(db: Awaited<ReturnType<typeof readDb>>, seasonId: string): string[] {
  const errors: string[] = [];

  const matchIds = new Set(db.matches.map((m) => m.id));
  for (const m of db.matches.filter((m) => m.season_id === seasonId)) {
    const events = db.match_goal_events.filter((e) => e.match_id === m.id);
    const stats = db.match_player_stats.filter((s) => s.match_id === m.id);
    if (m.status === "played") {
      if (m.goals_for !== events.length) errors.push(`Match ${m.id}: goals_for (${m.goals_for}) != events (${events.length})`);
      const g = stats.reduce((a, s) => a + s.goals, 0);
      if (g !== events.length) errors.push(`Match ${m.id}: stat-goals (${g}) != events (${events.length})`);
      if (m.wotm_player_id && !db.players.some((p) => p.id === m.wotm_player_id)) errors.push(`Match ${m.id}: MVP verwijst naar onbekende speler`);
      if (!m.wotm_player_id) errors.push(`Match ${m.id}: MVP ontbreekt`);
    }
  }
  for (const e of db.match_goal_events) {
    if (!matchIds.has(e.match_id)) errors.push(`Orphan goal_event ${e.id}: onbekende match_id`);
  }

  const sessIds = new Set(db.training_sessions.map((s) => s.id));
  for (const a of db.training_attendance) {
    if (!sessIds.has(a.session_id)) errors.push(`Training attendance orphan: ${a.session_id}/${a.player_id}`);
  }
  for (const s of db.training_sessions.filter((s) => s.season_id === seasonId)) {
    const rows = db.training_attendance.filter((a) => a.session_id === s.id);
    if (s.status === "cancelled" && rows.length > 0) errors.push(`Cancelled session ${s.id} bevat attendance rows`);
  }

  const memberSet = new Set(
    db.player_season_memberships.filter((m) => m.season_id === seasonId).map((m) => m.player_id),
  );
  for (const s of db.match_player_stats) {
    if (!memberSet.has(s.player_id) && !db.players.find((p) => p.id === s.player_id)?.is_guest) {
      errors.push(`Player ${s.player_id} gebruikt in stats zonder season membership`);
    }
  }

  return errors;
}

export default async function DataIntegrityPage() {
  const db = await readDb();
  const cookieSeason = (await cookies()).get("zvv_season_id")?.value;
  const seasonId = resolveSeasonId(db, cookieSeason);
  const errors = runIntegrityChecks(db, seasonId);

  return (
    <div className="space-y-8">
      <header className="border-b border-zvv-border pb-8">
        <p className="club-page-eyebrow">Beheer · Data Integrity</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-wide text-zvv-ink md:text-5xl">Data Integrity Check</h1>
      </header>
      <GlassCard>
        {errors.length === 0 ? (
          <p className="text-emerald-700 font-semibold">✅ ALL GOOD</p>
        ) : (
          <>
            <p className="font-semibold text-red-700">❌ {errors.length} integrity errors</p>
            <ul className="mt-3 list-disc list-inside text-sm text-red-800 space-y-1">
              {errors.map((e) => <li key={e}>{e}</li>)}
            </ul>
          </>
        )}
      </GlassCard>
    </div>
  );
}
