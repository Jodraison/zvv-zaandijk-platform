import Link from "next/link";
import { notFound } from "next/navigation";
import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { nextScheduledMatch } from "@/lib/queries/matches";
import { ClubHomeHero } from "@/components/home/club-home-hero";
import {
  formatBirthdayDateNL,
  getBirthdayPlayersForDate,
  parseBirthDateParts,
  resolveBirthdayPreviewDate,
} from "@/lib/players/birthdays";
import { mapSquadToBirthdayPeople } from "@/lib/players/birthday-squad";
import type { HomeBirthdayPlayer } from "@/components/home/home-birthday-spotlight";
import { buildHomeTeamSpotlight } from "@/lib/home/team-spotlight";
import { withSeason } from "@/lib/admin/beheer-nav";

type Props = {
  searchParams: Promise<{ season?: string; datum?: string; playerId?: string }>;
};

/**
 * Authenticated preview van de echte homepage-verjaardagsspotlight.
 * Geen publieke datummanipulatie — alleen via /beheer.
 */
export default async function BeheerBirthdayPreviewPage({ searchParams }: Props) {
  const sp = await searchParams;
  const db = await readDb();
  const seasonId = await readResolvedSeasonId(db, sp.season);
  const nextM = nextScheduledMatch(db, seasonId);

  let datum = (sp.datum ?? "").trim().slice(0, 10);
  if (!datum && sp.playerId) {
    const pl = db.players.find((p) => p.id === sp.playerId);
    if (pl?.birth_date) {
      const parts = parseBirthDateParts(pl.birth_date);
      if (parts) {
        datum = `2026-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
      }
    }
  }
  if (!parseBirthDateParts(datum)) notFound();

  const squadPeople = mapSquadToBirthdayPeople(db, seasonId);
  const birthdayPlayers: HomeBirthdayPlayer[] = getBirthdayPlayersForDate(squadPeople, datum).map(
    (p) => ({
      ...p,
      href: `/selectie/${encodeURIComponent(p.id)}?season=${encodeURIComponent(seasonId)}`,
    }),
  );

  return (
    <div className="space-y-4" data-testid="birthday-admin-preview">
      <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 md:px-5">
        <p className="font-semibold">Voorbeeldweergave — niet openbaar</p>
        <p className="mt-1 text-amber-900/90">
          Dit is de echte homepagecompositie voor {formatBirthdayDateNL(datum)} (voorbeeldkalender, Europe/Amsterdam).
          Bezoekers kunnen dit niet forceren via een openbare URL.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            href={withSeason("/beheer", seasonId)}
            className="inline-flex min-h-10 items-center text-sm font-semibold text-amber-950 underline-offset-4 hover:underline"
          >
            ← Terug naar beheer
          </Link>
          <Link
            href={withSeason("/beheer/spelers", seasonId)}
            className="inline-flex min-h-10 items-center text-sm font-semibold text-amber-950 underline-offset-4 hover:underline"
          >
            Speelsters
          </Link>
        </div>
      </div>

      <div className="-mx-4 overflow-hidden rounded-2xl border border-zvv-border shadow-sm md:-mx-0">
        <ClubHomeHero
          seasonId={seasonId}
          nextM={nextM}
          birthdayPlayers={birthdayPlayers}
          teamSpotlight={buildHomeTeamSpotlight(
            db,
            seasonId,
            resolveBirthdayPreviewDate(datum, { allowPreview: true }) ?? new Date(),
          )}
        />
      </div>
    </div>
  );
}
