import { cookies } from "next/headers";
import { readDb } from "@/lib/data/repository";
import { resolveSeasonId } from "@/lib/season";
import { TrainingAttendanceDashboard } from "@/components/admin/training-attendance-dashboard";

export default async function BeheerTrainingPage() {
  const db = await readDb();
  const cookieSeason = (await cookies()).get("zvv_season_id")?.value;
  const seasonId = resolveSeasonId(db, cookieSeason);
  const sessions = db.training_sessions
    .filter((s) => s.season_id === seasonId)
    .sort((a, b) => b.session_at.localeCompare(a.session_at))
    .map((s) => ({ id: s.id, session_at: s.session_at, title: s.title, status: s.status }));
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
      <header className="border-b border-zvv-border pb-10">
        <p className="club-page-eyebrow">Beheer · Training</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-wide text-zvv-ink md:text-5xl">Training aanwezigheid</h1>
        <p className="mt-3 max-w-2xl text-sm text-zvv-muted">
          Premium bulk workflow voor maandag/woensdag: snel terugwerken, direct togglen en in batch opslaan.
        </p>
      </header>
      <TrainingAttendanceDashboard seasonId={seasonId} players={players} sessions={sessions} attendance={attendance} />
    </div>
  );
}
