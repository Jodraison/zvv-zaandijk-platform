"use client";

import Link from "next/link";
import { MatchDeleteDialog } from "@/components/admin/match-delete-dialog";
import { MatchCountdownLabel } from "@/components/match/match-countdown-label";

export function AdminMatchRowActions({
  matchId,
  seasonId,
  opponent,
  kickoffAt,
  status,
  hasStats,
  showFinish,
}: {
  matchId: string;
  seasonId: string;
  opponent: string;
  kickoffAt: string;
  status: string;
  hasStats: boolean;
  showFinish: boolean;
}) {
  const q = `?season=${encodeURIComponent(seasonId)}`;
  return (
    <div className="flex shrink-0 flex-col items-end gap-2">
      <p className="text-sm font-semibold text-zvv-ink">
        <MatchCountdownLabel startsAt={kickoffAt} status={status} showSecondary={false} />
      </p>
      <Link
        href={`/wedstrijden/${matchId}${q}`}
        className="text-sm font-semibold text-zvv-primary hover:underline"
      >
        Bekijken
      </Link>
      <Link
        href={`/beheer/wedstrijden/${matchId}${q}&step=opstelling`}
        className="text-sm font-semibold text-zvv-primary hover:underline"
      >
        Voorbereiden
      </Link>
      <Link
        href={`/beheer/wedstrijden/${matchId}${q}&step=wedstrijd`}
        className="text-sm font-semibold text-zvv-primary hover:underline"
      >
        Bewerken
      </Link>
      {showFinish ? (
        <Link
          href={`/beheer/wedstrijden/${matchId}${q}&step=na-de-wedstrijd&finish=1`}
          className="club-btn-primary club-btn-primary-sm"
        >
          Wedstrijd afronden
        </Link>
      ) : null}
      <MatchDeleteDialog
        matchId={matchId}
        opponent={opponent}
        kickoffAt={kickoffAt}
        status={status}
        hasStats={hasStats}
        seasonId={seasonId}
        triggerClassName="text-sm font-semibold text-red-700 hover:underline"
        triggerLabel="Wedstrijd verwijderen"
      />
    </div>
  );
}
