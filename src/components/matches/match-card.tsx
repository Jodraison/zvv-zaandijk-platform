import Link from "next/link";
import type { ClubDatabase, Match } from "@/types";
import { matchResult } from "@/lib/queries/matches";
import { resolveMatchScore } from "@/lib/domain/match-score";
import { displayTeamLabel } from "@/constants/club";
import { matchTypeLabel } from "@/lib/match-type";
import { cn } from "@/lib/utils";
import { formatKickoffLongNl } from "@/lib/utils/format-date";
import { MatchCountdownLabel } from "@/components/match/match-countdown-label";
import { resolveMatchDataScope } from "@/lib/match/match-data-scope";

export function MatchCard({
  db,
  m,
  seasonId,
  featured = false,
}: {
  db: ClubDatabase;
  m: Match;
  seasonId: string;
  /** Volgende wedstrijd — volle breedte, meer gewicht */
  featured?: boolean;
}) {
  const r = matchResult(db, m);
  const score = resolveMatchScore(m);
  const played = m.status === "played";
  const href = `/wedstrijden/${m.id}?season=${encodeURIComponent(seasonId)}`;
  const whenLabel = formatKickoffLongNl(m.kickoff_at);
  const scope = resolveMatchDataScope(m);
  const resultNl =
    !played || !r ? null : r === "W" ? "Winst" : r === "L" ? "Verlies" : "Gelijkspel";

  return (
    <Link
      href={href}
      prefetch
      className={cn(
        "group relative block overflow-hidden rounded-[1.35rem] border transition-[transform,box-shadow,border-color] duration-200",
        featured ? "md:col-span-2" : "",
        played && r === "W"
          ? "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-zvv-primary-muted/40 shadow-[0_12px_40px_rgba(21,128,61,0.12)]"
          : played && r === "L"
            ? "border-zvv-border bg-gradient-to-br from-slate-50 to-white shadow-sm"
            : "border-zvv-border bg-gradient-to-br from-zvv-night/[0.04] via-white to-zvv-primary-muted/30 shadow-[0_10px_36px_rgba(12,25,41,0.08)]",
        "motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[0_18px_48px_rgba(29,78,216,0.16)]",
        featured ? "p-6 md:p-10" : "p-5 md:p-7",
      )}
    >
      <span
        className={cn(
          "absolute inset-x-0 top-0 h-1",
          played && r === "W"
            ? "bg-gradient-to-r from-emerald-500 via-zvv-primary to-emerald-400"
            : played && r === "L"
              ? "bg-slate-300"
              : "bg-gradient-to-r from-zvv-primary via-sky-400 to-zvv-primary",
        )}
        aria-hidden
      />

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em]",
              played ? "bg-zvv-night text-white" : "bg-zvv-primary text-white",
            )}
          >
            {matchTypeLabel(m.match_type)}
            {played ? " · Gespeeld" : " · Gepland"}
          </span>
          {scope !== "production" ? (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-900">
              DEMO
            </span>
          ) : null}
        </div>
        {r && played ? (
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-white shadow-md",
              r === "W" && "bg-emerald-500 shadow-emerald-500/30",
              r === "L" && "bg-rose-500/90",
              r === "D" && "bg-slate-400",
            )}
            aria-label={resultNl ?? undefined}
          >
            {r === "W" ? "W" : r === "L" ? "V" : "G"}
          </span>
        ) : null}
      </div>

      {featured && !played ? (
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-zvv-primary">Volgende wedstrijd</p>
      ) : null}
      {played && r === "W" ? (
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Overwinning</p>
      ) : null}

      <div className={cn("mt-4 grid items-center gap-3", featured ? "md:grid-cols-[1fr_auto_1fr] md:gap-8" : "grid-cols-[1fr_auto_1fr] gap-3")}>
        <div className="min-w-0 text-center sm:text-right">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zvv-muted">
            {m.is_home ? "Thuis" : "Uit"}
          </p>
          <p
            className={cn(
              "mt-2 break-words font-[family-name:var(--font-display)] leading-tight tracking-wide text-zvv-ink",
              featured ? "text-[clamp(1.4rem,3.5vw,2.4rem)]" : "text-[clamp(1.15rem,3vw,1.75rem)]",
            )}
          >
            {displayTeamLabel(score.homeTeam)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-center px-1">
          <div className="flex items-baseline gap-2 sm:gap-3">
            <span
              className={cn(
                "font-[family-name:var(--font-display)] leading-none tabular-nums tracking-tight text-zvv-ink",
                featured ? "text-[clamp(3.5rem,9vw,5.5rem)]" : "text-[clamp(2.8rem,8vw,4.5rem)]",
                played && r === "W" && "text-emerald-800",
              )}
            >
              {played ? score.homeScore : "—"}
            </span>
            <span className="font-[family-name:var(--font-display)] text-2xl text-zvv-primary/50 sm:text-3xl">–</span>
            <span
              className={cn(
                "font-[family-name:var(--font-display)] leading-none tabular-nums tracking-tight text-zvv-ink",
                featured ? "text-[clamp(3.5rem,9vw,5.5rem)]" : "text-[clamp(2.8rem,8vw,4.5rem)]",
              )}
            >
              {played ? score.awayScore : "—"}
            </span>
          </div>
          {!played ? (
            <p className="mt-2 text-center text-sm font-semibold text-zvv-primary">
              <MatchCountdownLabel startsAt={m.kickoff_at} status={m.status} showSecondary={false} />
            </p>
          ) : null}
        </div>
        <div className="min-w-0 text-center sm:text-left">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zvv-muted">
            {m.is_home ? "Uit" : "Thuis"}
          </p>
          <p
            className={cn(
              "mt-2 break-words font-[family-name:var(--font-display)] leading-tight tracking-wide text-zvv-ink",
              featured ? "text-[clamp(1.4rem,3.5vw,2.4rem)]" : "text-[clamp(1.15rem,3vw,1.75rem)]",
            )}
          >
            {displayTeamLabel(score.awayTeam)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-t border-zvv-border/70 pt-4">
        <div>
          <p className="text-sm font-medium text-zvv-muted">{whenLabel}</p>
          {m.location ? <p className="mt-0.5 text-sm text-zvv-ink">{m.location}</p> : null}
        </div>
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-zvv-primary transition-transform group-hover:translate-x-0.5">
          Bekijk wedstrijd →
        </span>
      </div>
    </Link>
  );
}
