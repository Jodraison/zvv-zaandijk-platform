import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { AdminPageHeader, AdminSection } from "@/components/admin/shell/admin-ui";
import { GlassCard } from "@/components/layout/glass-card";

function runIntegrityChecks(db: Awaited<ReturnType<typeof readDb>>, seasonId: string): string[] {
  const errors: string[] = [];

  const matchIds = new Set(db.matches.map((m) => m.id));
  for (const m of db.matches.filter((m) => m.season_id === seasonId)) {
    const events = db.match_goal_events.filter((e) => e.match_id === m.id);
    const stats = db.match_player_stats.filter((s) => s.match_id === m.id);
    if (m.status === "played") {
      if (m.goals_for !== events.length) {
        errors.push(
          `Wedstrijd ${m.opponent}: eindstand (${m.goals_for}) komt niet overeen met doelpunten (${events.length})`,
        );
      }
      const g = stats.reduce((a, s) => a + s.goals, 0);
      if (g !== events.length) {
        errors.push(
          `Wedstrijd ${m.opponent}: spelerstatistieken (${g} goals) komen niet overeen met doelpunten (${events.length})`,
        );
      }
      if (m.wotm_player_id && !db.players.some((p) => p.id === m.wotm_player_id)) {
        errors.push(`Wedstrijd ${m.opponent}: MVP verwijst naar onbekende speelster`);
      }
      if (!m.wotm_player_id) errors.push(`Wedstrijd ${m.opponent}: MVP ontbreekt`);
    } else if (m.wotm_player_id) {
      errors.push(`Wedstrijd ${m.opponent}: MVP gezet op niet-gespeelde wedstrijd`);
    }
  }
  for (const e of db.match_goal_events) {
    if (!matchIds.has(e.match_id)) errors.push(`Los doelpunt-event (${e.id}): wedstrijd niet gevonden`);
  }

  const sessIds = new Set(db.training_sessions.map((s) => s.id));
  for (const a of db.training_attendance) {
    if (!sessIds.has(a.session_id)) {
      errors.push(`Training-aanwezigheid zonder sessie: ${a.session_id}/${a.player_id}`);
    }
  }
  for (const s of db.training_sessions.filter((s) => s.season_id === seasonId)) {
    const rows = db.training_attendance.filter((a) => a.session_id === s.id);
    if (s.status === "cancelled" && rows.length > 0) {
      errors.push(`Geannuleerde training (${s.title ?? s.id}) bevat nog aanwezigheidsregels`);
    }
  }

  const memberSet = new Set(
    db.player_season_memberships.filter((m) => m.season_id === seasonId).map((m) => m.player_id),
  );
  for (const s of db.match_player_stats) {
    if (!memberSet.has(s.player_id) && !db.players.find((p) => p.id === s.player_id)?.is_guest) {
      errors.push(`Speelster ${s.player_id} in wedstrijdstatistieken zonder seizoenslidmaatschap`);
    }
  }

  return errors;
}

export default async function DataIntegrityPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const sp = await searchParams;
  const db = await readDb();
  const seasonId = await readResolvedSeasonId(db, sp.season);
  const errors = runIntegrityChecks(db, seasonId);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Beheer · Controle"
        title="Datacontrole"
        description="Controleer of wedstrijden, statistieken, MVP's en training-aanwezigheid kloppen voor dit seizoen."
      />
      <AdminSection title="Resultaat">
        <GlassCard>
          {errors.length === 0 ? (
            <p className="font-semibold text-emerald-700">Alles in orde — geen afwijkingen gevonden.</p>
          ) : (
            <>
              <p className="font-semibold text-red-700">
                {errors.length} {errors.length === 1 ? "afwijking" : "afwijkingen"} gevonden
              </p>
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-red-800">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </>
          )}
        </GlassCard>
      </AdminSection>
    </div>
  );
}
