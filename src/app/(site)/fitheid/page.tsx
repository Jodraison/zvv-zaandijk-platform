import { cookies } from "next/headers";
import { readDb } from "@/lib/data/repository";

export const dynamic = "force-dynamic";
import { resolveSeasonId } from "@/lib/season";
import { fitnessTotalSeconds } from "@/lib/fitness-analytics";
import { formatSprintSecondsNl } from "@/lib/import/fitness-time";
import { cn } from "@/lib/utils";
import { formatDateNL } from "@/lib/utils/format-date";
import type { FitnessProgressStatus } from "@/types";

function deltaLabel(latestSec: number, prevSec: number): { text: string; cls: string; symbol: string } {
  const raw = Math.round((latestSec - prevSec) * 100) / 100;
  if (Math.abs(raw) < 0.05) {
    return { text: "0 s", cls: "text-zvv-muted", symbol: "=" };
  }
  if (raw < 0) {
    return {
      text: `${raw.toLocaleString("nl-NL", { minimumFractionDigits: raw % 1 ? 1 : 0, maximumFractionDigits: 2 })} s`,
      cls: "font-bold text-emerald-600",
      symbol: "↑",
    };
  }
  return {
    text: `+${raw.toLocaleString("nl-NL", { minimumFractionDigits: raw % 1 ? 1 : 0, maximumFractionDigits: 2 })} s`,
    cls: "font-bold text-red-600",
    symbol: "↓",
  };
}

function StatusFromDelta({ latestSec, prevSec }: { latestSec: number; prevSec: number | null }) {
  if (prevSec == null) {
    return <span className="text-zvv-muted">—</span>;
  }
  const { symbol } = deltaLabel(latestSec, prevSec);
  if (symbol === "=") {
    return <span className="font-semibold text-zvv-muted">= gelijk</span>;
  }
  if (symbol === "↑") {
    return (
      <span className="font-bold text-emerald-600">
        <span aria-hidden>↑</span> sneller
      </span>
    );
  }
  return (
    <span className="font-bold text-red-600">
      <span aria-hidden>↓</span> langzamer
    </span>
  );
}

function DeltaCell({ latestSec, prevSec }: { latestSec: number; prevSec: number }) {
  const d = deltaLabel(latestSec, prevSec);
  return (
    <span className={d.cls}>
      {d.symbol === "↑" ? "↑ " : d.symbol === "↓" ? "↓ " : ""}
      {d.text}
    </span>
  );
}

function LegacyStatusUi({ status }: { status: FitnessProgressStatus | null }) {
  if (status === "improved") {
    return (
      <span className="font-bold text-emerald-600">
        <span aria-hidden>↑</span> sneller
      </span>
    );
  }
  if (status === "declined") {
    return (
      <span className="font-bold text-red-600">
        <span aria-hidden>↓</span> langzamer
      </span>
    );
  }
  if (status === "equal") {
    return <span className="font-semibold text-zvv-muted">= gelijk</span>;
  }
  return <span className="text-zvv-muted">—</span>;
}

export default async function FitheidPage() {
  const db = await readDb();
  const cookieSeason = (await cookies()).get("zvv_season_id")?.value;
  const seasonId = resolveSeasonId(db, cookieSeason);
  const tests = db.fitness_tests.filter((f) => f.season_id === seasonId && f.test_type === "sprint_20_40_60");
  const members = db.player_season_memberships.filter((m) => m.season_id === seasonId);
  const players = members.map((mem) => ({
    id: mem.player_id,
    name: db.players.find((p) => p.id === mem.player_id)?.full_name ?? "—",
    shirt: mem.shirt_number,
  }));

  const latestSessionDate = tests.reduce<string | null>((best, t) => {
    if (!best || t.test_on > best) return t.test_on;
    return best;
  }, null);

  const onLatest = latestSessionDate
    ? tests.filter((t) => t.test_on === latestSessionDate).sort((a, b) => fitnessTotalSeconds(a) - fitnessTotalSeconds(b))
    : [];

  let previousTime: number | null = null;
  let previousRank = 0;
  const rankedLatest = onLatest.map((item, index) => {
    const currentTime = fitnessTotalSeconds(item);
    const rank =
      index === 0
        ? 1
        : currentTime === previousTime
          ? previousRank
          : previousRank + 1;
    previousTime = currentTime;
    previousRank = rank;
    return { item, rank, totalTimeNumeric: currentTime };
  });

  const first = rankedLatest[0];
  const fastestGroup = rankedLatest.filter((row) => row.rank === 1);
  const podiumGroups = [1, 2, 3]
    .map((rank) => ({
      rank,
      items: rankedLatest.filter((row) => row.rank === rank),
    }))
    .filter((group) => group.items.length > 0);

  const byPlayer = players.map((pl) => {
    const mine = tests.filter((t) => t.player_id === pl.id).sort((a, b) => a.test_on.localeCompare(b.test_on));
    const latest = mine.length ? mine[mine.length - 1] : null;
    const previous = mine.length > 1 ? mine[mine.length - 2] : null;
    const latestSec = latest ? fitnessTotalSeconds(latest) : null;
    const prevSec = previous ? fitnessTotalSeconds(previous) : null;
    return { pl, latest, previous, latestSec, prevSec };
  });

  byPlayer.sort((a, b) => a.pl.name.localeCompare(b.pl.name, "nl"));

  let mostImproved: (typeof byPlayer)[number] | null = null;
  let bestDelta = 0;
  for (const row of byPlayer) {
    if (row.latestSec == null || row.prevSec == null) continue;
    const delta = row.prevSec - row.latestSec;
    if (delta > 0.05 && delta > bestDelta) {
      bestDelta = delta;
      mostImproved = row;
    }
  }

  const sessionLabel = latestSessionDate ? formatDateNL(latestSessionDate) : null;

  return (
    <div className="space-y-12 md:space-y-16">
      <header className="club-section-surface club-reveal">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zvv-primary">Fitheid</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2.5rem,6vw,3.85rem)] tracking-wide text-zvv-ink md:text-6xl">
          Fitheidstest 20-40-60m
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-zvv-muted">
          Sprint 20 / 40 / 60 meter met totaaltijd per testdag. Lager is sneller. Groen betekent progressie, rood betekent tijdverlies t.o.v. de vorige meting.
        </p>
      </header>

      {latestSessionDate && first ? (
        <section aria-labelledby="fit-podium-heading" className="club-reveal club-section-surface space-y-8">
          <div>
            <h2 id="fit-podium-heading" className="font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,2.75rem)] tracking-wide text-zvv-ink">
              Snelste drie
            </h2>
            <p className="mt-2 text-[15px] text-zvv-muted">{sessionLabel}</p>
          </div>

          <div className="mx-auto max-w-5xl space-y-6">
            {podiumGroups.map((group) => (
              <div key={`rank-group-${group.rank}`} className="space-y-3">
                <p className="text-center text-xs font-bold uppercase tracking-[0.16em] text-zvv-muted">Plaats {group.rank}</p>
                <div className="flex flex-wrap items-stretch justify-center gap-4 md:gap-6">
                  {group.items.map((row) => (
                    <div key={`${group.rank}-${row.item.player_id}`} className="w-full max-w-[14rem]">
                      <PodiumCard
                        medal={medalForRank(group.rank)}
                        place={group.rank}
                        name={players.find((p) => p.id === row.item.player_id)?.name ?? "—"}
                        shirt={players.find((p) => p.id === row.item.player_id)?.shirt}
                        sec={row.totalTimeNumeric}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {latestSessionDate && first ? (
        <section aria-labelledby="fit-spotlights-heading" className="club-reveal club-section-surface space-y-5">
          <div>
            <h2 id="fit-spotlights-heading" className="font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,2.75rem)] tracking-wide text-zvv-ink">
              Performance in de spotlights
            </h2>
            <p className="mt-2 text-[15px] text-zvv-muted">Snelheid en vooruitgang ten opzichte van je vorige meting.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border-2 border-zvv-primary/20 bg-gradient-to-br from-white to-zvv-primary-muted p-6 shadow-[var(--shadow-zvv-card)] transition-transform duration-200 motion-safe:hover:-translate-y-0.5">
              <p className="text-3xl leading-none" aria-hidden>
                ⚡
              </p>
              <p className="mt-3 text-[11px] font-black uppercase tracking-[0.2em] text-zvv-primary">
                {fastestGroup.length > 1 ? "Snelste speelsters" : "Snelste speelster"}
              </p>
              {fastestGroup.length > 1 ? (
                <>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink md:text-3xl">
                    {fastestGroup
                      .map((row) => players.find((p) => p.id === row.item.player_id)?.name ?? "—")
                      .join(" · ")}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-zvv-primary">Gedeeld snelste tijd</p>
                </>
              ) : (
                <p className="mt-2 font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink md:text-3xl">
                  {players.find((p) => p.id === first.item.player_id)?.name ?? "—"}
                </p>
              )}
              <p className="mt-3 font-[family-name:var(--font-display)] text-4xl tabular-nums tracking-tight text-zvv-primary md:text-5xl">
                {formatSprintSecondsNl(first.totalTimeNumeric)}
              </p>
              <p className="mt-2 text-sm text-zvv-muted">{sessionLabel}</p>
            </div>
            <div
              className={cn(
                "rounded-2xl border-2 p-6 shadow-[var(--shadow-zvv-card)] transition-transform duration-200 motion-safe:hover:-translate-y-0.5",
                mostImproved
                  ? "border-emerald-400/40 bg-gradient-to-br from-emerald-50/90 to-white"
                  : "border-dashed border-zvv-border bg-zvv-card-mid/40",
              )}
            >
              <p className="text-3xl leading-none" aria-hidden>
                📈
              </p>
              <p className="mt-3 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-800">Meest verbeterd</p>
              {mostImproved ? (
                <>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink md:text-3xl">
                    {mostImproved.pl.name}
                  </p>
                  <p className="mt-3 text-lg font-semibold text-emerald-700">
                    <span aria-hidden>↑</span>{" "}
                    {formatSprintSecondsNl(bestDelta)} sneller dan vorige keer
                  </p>
                  <p className="mt-2 text-sm text-zvv-muted">
                    {mostImproved.latestSec != null ? formatSprintSecondsNl(mostImproved.latestSec) : "—"} nu ·{" "}
                    {mostImproved.prevSec != null ? formatSprintSecondsNl(mostImproved.prevSec) : "—"} eerder
                  </p>
                </>
              ) : (
                <p className="mt-4 text-[15px] text-zvv-muted">Nog geen vergelijking met een eerdere meting voor het team.</p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="fit-team-heading" className="club-reveal club-section-surface space-y-8">
        <h2 id="fit-team-heading" className="font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,2.75rem)] tracking-wide text-zvv-ink">
          Team — laatste meting
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {byPlayer.map(({ pl, latest, previous, latestSec, prevSec }) => (
            <div
              key={pl.id}
              className="rounded-2xl border border-zvv-border bg-zvv-card p-5 shadow-[var(--shadow-zvv-card)] transition-transform duration-200 motion-safe:hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-[family-name:var(--font-display)] text-xl tracking-wide text-zvv-ink md:text-2xl">{pl.name}</p>
                  <p className="mt-1 text-sm font-medium text-zvv-muted">#{pl.shirt}</p>
                </div>
              </div>
              <div className="mt-6 space-y-3 border-t border-zvv-border pt-5 text-[15px]">
                <div className="flex justify-between gap-4">
                  <span className="text-zvv-muted">Laatste tijd</span>
                  <span className="font-[family-name:var(--font-display)] text-2xl tabular-nums tracking-wide text-zvv-primary md:text-3xl">
                    {latest && latestSec != null ? formatSprintSecondsNl(latestSec) : "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-zvv-muted">Vorige</span>
                  <span className="tabular-nums font-medium text-zvv-ink">
                    {previous && prevSec != null ? formatSprintSecondsNl(prevSec) : "—"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zvv-border pt-4">
                  <span className="text-sm text-zvv-muted">T.o.v. vorige keer</span>
                  <span className="text-sm">
                    {latest && latestSec != null ? (
                      prevSec != null ? (
                        <DeltaCell latestSec={latestSec} prevSec={prevSec} />
                      ) : (
                        <LegacyStatusUi status={latest.progress_status} />
                      )
                    ) : (
                      <span className="text-zvv-muted">—</span>
                    )}
                  </span>
                </div>
                <div className="text-sm">
                  {latest && latestSec != null ? (
                    prevSec != null ? (
                      <StatusFromDelta latestSec={latestSec} prevSec={prevSec} />
                    ) : (
                      <LegacyStatusUi status={latest.progress_status} />
                    )
                  ) : (
                    <span className="text-zvv-muted">Nog geen meting</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PodiumCard({
  medal,
  place,
  name,
  shirt,
  sec,
}: {
  medal: string;
  place: number;
  name: string;
  shirt: number | undefined;
  sec: number;
}) {
  return (
    <div
      className={cn(
        "relative flex h-full flex-col items-center rounded-2xl border bg-zvv-card px-5 py-8 text-center shadow-[var(--shadow-zvv-card)]",
        place === 1 ? "border-zvv-primary/35 ring-2 ring-zvv-primary/15" : "border-zvv-border",
      )}
    >
      <span className="text-5xl leading-none md:text-6xl" aria-hidden>
        {medal}
      </span>
      <p className="mt-2 inline-flex items-center rounded-full border border-zvv-border bg-white px-2 py-0.5 text-xs font-semibold text-zvv-muted">
        Plaats {place}
      </p>
      <p className="mt-4 font-[family-name:var(--font-display)] text-3xl tabular-nums tracking-wide text-zvv-primary md:text-4xl">
        {formatSprintSecondsNl(sec)}
      </p>
      <p className="mt-3 font-[family-name:var(--font-display)] text-lg tracking-wide text-zvv-ink md:text-xl">{name}</p>
      <p className="mt-1 text-sm text-zvv-muted">#{shirt}</p>
    </div>
  );
}

function medalForRank(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  return "🥉";
}
