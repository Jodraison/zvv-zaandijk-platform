import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { TrainingAttendanceDashboard } from "@/components/admin/training-attendance-dashboard";
import { AdminPageHeader } from "@/components/admin/shell/admin-ui";
import { resolveAuthContext, roleHasCapability } from "@/lib/auth/capabilities";

type Props = { searchParams: Promise<{ season?: string; session?: string; sid?: string }> };

export default async function BeheerTrainingPage({ searchParams }: Props) {
  const sp = await searchParams;
  const db = await readDb();
  const seasonId = await readResolvedSeasonId(db, sp.season);
  const auth = await resolveAuthContext();
  const canDeleteSessions = !!auth && roleHasCapability(auth.role, "system_admin");

  const sessions = db.training_sessions
    .filter((s) => s.season_id === seasonId)
    .sort((a, b) => b.session_at.localeCompare(a.session_at))
    .map((s) => ({
      id: s.id,
      session_at: s.session_at,
      title: s.title,
      status: s.status,
      location: s.location,
    }));
  const players = db.player_season_memberships
    .filter((m) => m.season_id === seasonId)
    .map((mem) => {
      const pl = db.players.find((p) => p.id === mem.player_id);
      return {
        player_id: mem.player_id,
        name: pl?.full_name ?? "—",
        shirt_number: mem.shirt_number,
        position: mem.display_position || mem.position,
        is_guest: pl?.is_guest ?? false,
      };
    })
    .filter((p) => !p.is_guest);
  const attendance = db.training_attendance.map((a) => ({
    session_id: a.session_id,
    player_id: a.player_id,
    present: a.present,
  }));

  return (
    <div className="space-y-10">
      <AdminPageHeader
        eyebrow="Beheer · Training"
        title="Training aanwezigheid"
        description="Voeg trainingen handmatig toe, verplaats of afgelast, en registreer aanwezigheid eerlijk — zonder automatische aanwezigheid."
      />
      <TrainingAttendanceDashboard
        seasonId={seasonId}
        players={players}
        sessions={sessions}
        attendance={attendance}
        canDeleteSessions={canDeleteSessions}
      />
    </div>
  );
}
