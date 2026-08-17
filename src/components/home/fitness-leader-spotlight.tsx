import Link from "next/link";
import type { ClubDatabase } from "@/types";
import { latestPublishedFitnessSession, rankFitnessTotal } from "@/lib/fitness/session-ranking";
import { formatHumanDateNL } from "@/lib/utils/format-date";
import { nextFitnessMoment } from "@/lib/operations/next-events";

export function FitnessLeaderSpotlight({
  db,
  seasonId,
}: {
  db: ClubDatabase;
  seasonId: string;
}) {
  const session = latestPublishedFitnessSession(db, seasonId);
  if (session) {
    const total = rankFitnessTotal(db, session.id);
    const leader = total[0];
    if (!leader) return null;
    return (
      <Link
        href={`/ranking?season=${encodeURIComponent(seasonId)}&view=fitheid`}
        className="mt-5 block rounded-2xl border border-white/18 bg-white/10 p-4 transition hover:bg-white/15 md:p-5"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-100/85">Performance spotlight</p>
        <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl tracking-wide text-white md:text-2xl">
          Leider actuele fitheidstest
        </h3>
        <p className="mt-3 text-lg font-semibold text-white">
          #{leader.shirt_number} {leader.full_name}
        </p>
        <p className="mt-1 text-sm text-blue-100/90">
          {formatHumanDateNL(session.test_on, { includeYear: true })} · {leader.totalScore.toLocaleString("nl-NL")} pt ·
          Ranking bekijken →
        </p>
      </Link>
    );
  }

  const next = nextFitnessMoment(db, seasonId);
  if (!next.date) return null;

  return (
    <Link
      href={`/ranking?season=${encodeURIComponent(seasonId)}&view=fitheid`}
      className="mt-5 block rounded-2xl border border-white/18 bg-white/10 p-4 transition hover:bg-white/15 md:p-5"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-100/85">Performance spotlight</p>
      <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl tracking-wide text-white md:text-2xl">
        Eerste fitheidstest
      </h3>
      <p className="mt-3 text-lg font-semibold uppercase tracking-wide text-white">
        {formatHumanDateNL(next.date, { includeYear: true })}
      </p>
      <p className="mt-1 text-sm text-blue-100/90">Sprint · Agility · Plank · 6 minuten lopen</p>
    </Link>
  );
}
