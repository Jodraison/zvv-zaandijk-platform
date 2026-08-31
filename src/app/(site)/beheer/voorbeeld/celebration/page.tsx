import Link from "next/link";
import { notFound } from "next/navigation";
import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { nextScheduledMatch } from "@/lib/queries/matches";
import { ClubHomeHero } from "@/components/home/club-home-hero";
import { HomepageCelebration } from "@/components/home/homepage-celebration";
import {
  getBirthdayPlayersForDate,
  parseBirthDateParts,
  resolveBirthdayPreviewDate,
} from "@/lib/players/birthdays";
import { mapSquadToBirthdayPeople } from "@/lib/players/birthday-squad";
import type { HomeBirthdayPlayer } from "@/components/home/home-birthday-spotlight";
import { buildHomeTeamSpotlight } from "@/lib/home/team-spotlight";
import {
  getHomepageCelebration,
  resolveCelebrationHoldPreview,
  resolveCelebrationPreviewType,
} from "@/lib/home/homepage-celebration";
import { withSeason } from "@/lib/admin/beheer-nav";

type Props = {
  searchParams: Promise<{ season?: string; kind?: string; datum?: string; hold?: string }>;
};

/**
 * Authenticated review van homepage-celebrations.
 * Geen publieke forcering — alleen via /beheer.
 */
export default async function BeheerCelebrationPreviewPage({ searchParams }: Props) {
  const sp = await searchParams;
  const db = await readDb();
  const seasonId = await readResolvedSeasonId(db, sp.season);
  const nextM = nextScheduledMatch(db, seasonId);

  const previewType = resolveCelebrationPreviewType(sp.kind, { allowPreview: true });
  if (!previewType) notFound();

  const hold = resolveCelebrationHoldPreview(sp.hold, { allowPreview: true });
  const wantsBirthday = previewType === "birthday" || previewType === "birthday_victory";

  let datum = (sp.datum ?? "").trim().slice(0, 10);
  if (wantsBirthday && !parseBirthDateParts(datum)) {
    datum = "2026-08-01";
  }

  const squadPeople = mapSquadToBirthdayPeople(db, seasonId);
  const birthdayOn = wantsBirthday
    ? resolveBirthdayPreviewDate(datum, { allowPreview: true }) ?? new Date()
    : new Date();
  const birthdayPlayers: HomeBirthdayPlayer[] = wantsBirthday
    ? getBirthdayPlayersForDate(squadPeople, datum || birthdayOn).map((p) => ({
        ...p,
        href: `/selectie/${encodeURIComponent(p.id)}?season=${encodeURIComponent(seasonId)}`,
      }))
    : [];

  const celebration = getHomepageCelebration({
    birthdayCount: birthdayPlayers.length,
    matches: db.matches,
    seasonId,
    now: birthdayOn,
    previewType,
  });

  const label =
    previewType === "birthday"
      ? "verjaardag"
      : previewType === "victory"
        ? "overwinning"
        : "verjaardag + overwinning";

  return (
    <div className="space-y-4" data-testid="celebration-admin-preview">
      <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 md:px-5">
        <p className="font-semibold">Voorbeeldweergave — niet openbaar</p>
        <p className="mt-1 text-amber-900/90">
          Homepage-celebration ({label}
          {hold ? ", stilstaand frame" : ""}). Bezoekers kunnen dit niet forceren via een openbare URL.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            href={withSeason("/beheer", seasonId)}
            className="inline-flex min-h-10 items-center text-sm font-semibold text-amber-950 underline-offset-4 hover:underline"
          >
            ← Terug naar beheer
          </Link>
          <Link
            href={withSeason("/beheer/voorbeeld/celebration?kind=birthday&hold=1", seasonId)}
            className="inline-flex min-h-10 items-center text-sm font-semibold text-amber-950 underline-offset-4 hover:underline"
          >
            Verjaardag hold
          </Link>
          <Link
            href={withSeason("/beheer/voorbeeld/celebration?kind=victory&hold=1", seasonId)}
            className="inline-flex min-h-10 items-center text-sm font-semibold text-amber-950 underline-offset-4 hover:underline"
          >
            Overwinning hold
          </Link>
          <Link
            href={withSeason("/beheer/voorbeeld/celebration?kind=combined&hold=1", seasonId)}
            className="inline-flex min-h-10 items-center text-sm font-semibold text-amber-950 underline-offset-4 hover:underline"
          >
            Gecombineerd hold
          </Link>
        </div>
      </div>

      <div className="-mx-4 overflow-hidden rounded-2xl border border-zvv-border shadow-sm md:-mx-0">
        <HomepageCelebration
          type={celebration.type}
          calendarDay={celebration.calendarDay}
          preview
          hold={hold}
        />
        <ClubHomeHero
          seasonId={seasonId}
          nextM={nextM}
          birthdayPlayers={birthdayPlayers}
          teamSpotlight={buildHomeTeamSpotlight(db, seasonId, birthdayOn)}
        />
      </div>
    </div>
  );
}
