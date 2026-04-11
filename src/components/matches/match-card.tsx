import Link from "next/link";
import type { ClubDatabase, Match } from "@/types";
import { matchResult } from "@/lib/queries/matches";
import { resolveMatchScore } from "@/lib/domain/match-score";
import { displayTeamLabel } from "@/constants/club";
import { cn } from "@/lib/utils";
import { formatKickoffLongNl } from "@/lib/utils/format-date";

export function MatchCard({ db, m, seasonId }: { db: ClubDatabase; m: Match; seasonId: string }) {
  const r = matchResult(db, m);
  const score = resolveMatchScore(m);
  const played = m.status === "played";
  const tone = !played ? "muted" : r === "W" ? "win" : r === "L" ? "loss" : "draw";
  const href = `/wedstrijden/${m.id}?season=${encodeURIComponent(seasonId)}`;
  const whenLabel = formatKickoffLongNl(m.kickoff_at);

  const resultNl =
    !played || !r ? null : r === "W" ? "Winst" : r === "L" ? "Verlies" : "Gelijk";

  return (
    <Link
      href={href}
      prefetch
      className={cn(
        "group relative block overflow-hidden rounded-2xl border border-zvv-border bg-gradient-to-br from-white to-zvv-card-mid/35 p-5 shadow-sm transition-[border-color,transform] duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-zvv-primary/25 md:p-8",
      )}
    >
      <span className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-zvv-primary via-zvv-primary/40 to-transparent opacity-80" aria-hidden />
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-zvv-border/90 pb-5">
        <span
          className={cn(
            "rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em]",
            played ? "bg-zvv-card-mid text-zvv-ink" : "border border-zvv-primary/20 bg-zvv-primary-muted text-zvv-primary",
          )}
        >
          {played ? "Gespeeld" : m.status === "scheduled" ? "Gepland" : m.status === "postponed" ? "Uitgesteld" : m.status}
        </span>
        {!played ? <span className="h-2 w-2 rounded-full bg-rose-400/90" aria-hidden /> : null}
        {r && played ? (
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold leading-none text-white",
              r === "W" && "bg-green-500",
              r === "L" && "bg-red-500",
              r === "D" && "bg-gray-400",
            )}
            aria-label={resultNl ?? undefined}
          >
            {r === "W" ? "W" : r === "L" ? "V" : "G"}
          </span>
        ) : null}
      </div>

      <div className="mt-7 rounded-2xl border border-zvv-border/80 bg-white/75 px-3 py-4 sm:px-4 sm:py-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
        <div className="min-w-0 text-center sm:text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zvv-muted">{m.is_home ? "Thuis" : "Uit"}</p>
          <p className="mt-2 break-words font-[family-name:var(--font-display)] text-[clamp(1.15rem,3.5vw,1.85rem)] leading-tight tracking-wide text-zvv-ink">
            {displayTeamLabel(score.homeTeam)}
          </p>
        </div>
        <div className="flex shrink-0 items-baseline justify-center gap-2 px-1 sm:gap-3">
          <span className="font-[family-name:var(--font-display)] text-[clamp(3.2rem,10vw,5.2rem)] leading-none tabular-nums tracking-tight text-zvv-ink">
            {played ? score.homeScore : "—"}
          </span>
          <span className="font-[family-name:var(--font-display)] text-[clamp(1.35rem,4vw,2.1rem)] text-zvv-primary/65">VS</span>
          <span className="font-[family-name:var(--font-display)] text-[clamp(3.2rem,10vw,5.2rem)] leading-none tabular-nums tracking-tight text-zvv-ink">
            {played ? score.awayScore : "—"}
          </span>
        </div>
        <div className="min-w-0 text-center sm:text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zvv-muted">{m.is_home ? "Uit" : "Thuis"}</p>
          <p className="mt-2 break-words font-[family-name:var(--font-display)] text-[clamp(1.15rem,3.5vw,1.85rem)] leading-tight tracking-wide text-zvv-ink">
            {displayTeamLabel(score.awayTeam)}
          </p>
        </div>
        </div>
      </div>

      <div className="mt-7 flex items-center justify-between gap-3 text-sm">
        <p className="font-medium text-zvv-muted">
        {whenLabel}
        </p>
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-zvv-primary transition-colors group-hover:text-zvv-primary-hover">Matchcenter →</span>
      </div>
    </Link>
  );
}
