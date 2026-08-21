import { Suspense } from "react";
import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { TrainingAttendanceDashboard } from "@/components/admin/training-attendance-dashboard";
import { AdminPageHeader } from "@/components/admin/shell/admin-ui";
import { resolveAuthContext, roleHasCapability } from "@/lib/auth/capabilities";
import { isTrainingSessionId } from "@/lib/training/training-attendance-workspace";
import { existingTrainingDateKeys, planRegularTrainingSessions } from "@/lib/training/regular-training-calendar";
import { ensureRegularTrainingSessionsAction } from "@/actions/training";
import { buildTrainingPerformanceCenter } from "@/lib/training/training-performance";

type Props = { searchParams: Promise<{ season?: string; session?: string; sid?: string }> };

export default async function BeheerTrainingPage({ searchParams }: Props) {
  const sp = await searchParams ?? {};
  let db = await readDb();
  const seasonId = await readResolvedSeasonId(db, sp.season);
  const planned = planRegularTrainingSessions(seasonId);
  const haveDates = existingTrainingDateKeys(db.training_sessions, seasonId);
  if (planned.some((p) => !haveDates.has(p.dateKey))) {
    await ensureRegularTrainingSessionsAction(seasonId);
    db = await readDb();
  }
  const auth = await resolveAuthContext();
  const canDeleteSessions = !!auth && roleHasCapability(auth.role, "system_admin");
  const requestedSid = String(sp.sid ?? "").trim();

  const sessions = db.training_sessions
    .filter((s) => s.season_id === seasonId)
    .sort((a, b) => b.session_at.localeCompare(a.session_at))
    .map((s) => ({
      id: s.id,
      session_at: String(s.session_at ?? ""),
      title: s.title ?? null,
      status: s.status,
      location: s.location ?? null,
    }));
  const sessionIds = new Set(sessions.map((s) => s.id));
  const missingSid = isTrainingSessionId(requestedSid) && !sessionIds.has(requestedSid);
  const players = db.player_season_memberships
    .filter((m) => m.season_id === seasonId)
    .map((mem) => {
      const pl = db.players.find((p) => p.id === mem.player_id);
      const shirt = Number(mem.shirt_number);
      return {
        player_id: mem.player_id,
        name: pl?.full_name ?? "—",
        shirt_number: Number.isFinite(shirt) ? shirt : null,
        position: mem.display_position || mem.position || null,
        photo_url: pl?.photo_url ?? null,
        is_guest: !!(pl?.is_guest ?? mem.is_guest),
      };
    })
    .filter((p) => !p.is_guest);
  const attendance = db.training_attendance
    .filter((a) => sessionIds.has(a.session_id))
    .map((a) => ({
      session_id: a.session_id,
      player_id: a.player_id,
      present: !!a.present,
      note: a.note ?? null,
    }));

  return (
    <div className="space-y-10">
      <AdminPageHeader
        eyebrow="Beheer · Training"
        title="Training aanwezigheid"
        description="Voeg trainingen handmatig toe, verplaats of afgelast, en registreer aanwezigheid eerlijk — zonder automatische aanwezigheid."
      />
      {missingSid ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Deze trainingssessie is niet gevonden in het gekozen seizoen. Kies een sessie hieronder of voeg een extra
          trainingsdag toe.
        </div>
      ) : null}
      <Suspense fallback={<p className="text-sm text-zvv-muted">Aanwezigheid laden…</p>}>
        <TrainingAttendanceDashboard
          seasonId={seasonId}
          players={players}
          sessions={sessions}
          attendance={attendance}
          canDeleteSessions={canDeleteSessions}
          performance={(() => {
            const center = buildTrainingPerformanceCenter(db, seasonId);
            return {
              trend: center.trend,
              adminRanking: center.adminRanking,
              withoutReasonCount: center.kpis.withoutReasonCount,
              absenceTotals: center.absenceTotals,
            };
          })()}
        />
      </Suspense>
    </div>
  );
}
