import { cookies } from "next/headers";
import { readDb } from "@/lib/data/repository";
import { resolveSeasonId } from "@/lib/season";
import { MatchAdminForm } from "@/components/admin/match-admin-form";

/** Snelle invoer na een gespeelde wedstrijd — standaard status &apos;gespeeld&apos;. */
export default async function WedstrijdToevoegenPage() {
  const db = await readDb();
  const cookieSeason = (await cookies()).get("zvv_season_id")?.value;
  const seasonId = resolveSeasonId(db, cookieSeason);
  const seasonPlayers = db.player_season_memberships
    .filter((m) => m.season_id === seasonId)
    .filter((m) => !db.players.find((p) => p.id === m.player_id)?.is_guest)
    .map((mem) => ({
      player_id: mem.player_id,
      shirt_number: mem.shirt_number,
      name: db.players.find((p) => p.id === mem.player_id)?.full_name ?? "—",
      is_guest: false,
      position_label: mem.display_position || mem.position,
    }))
    .sort((a, b) => a.shirt_number - b.shirt_number);
  const guestPlayers = db.players
    .filter((p) => p.is_guest)
    .map((p) => ({
      player_id: p.id,
      shirt_number: null,
      name: p.full_name,
      is_guest: true,
      position_label: null,
    }));
  const seen = new Set(seasonPlayers.map((p) => p.player_id));
  const members = [
    ...seasonPlayers,
    ...guestPlayers.filter((p) => !seen.has(p.player_id)),
  ];

  const initialMatch = {
    id: "new",
    opponent: "",
    kickoff_at: new Date().toISOString(),
    is_home: true,
    goals_against: 0,
    status: "played" as const,
    wotm_player_id: null as string | null,
  };

  return (
    <div className="space-y-8">
      <header className="border-b border-zvv-border pb-8">
        <p className="club-page-eyebrow">Beheer · Wedstrijdresultaat</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-wide text-zvv-ink md:text-5xl">Uitslag invoeren</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zvv-muted">
          Selectie, doelpunten met assists, MVP en automatische goals voor. Bedoeld voor direct na de wedstrijd (2–3 minuten).
        </p>
      </header>
      <MatchAdminForm
        seasonId={seasonId}
        members={members}
        mode="create"
        defaultStatus="played"
        initialMatch={initialMatch}
        initialSelectedIds={[]}
      />
    </div>
  );
}
