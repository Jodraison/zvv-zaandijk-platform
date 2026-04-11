"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, memo } from "react";
import { TEAM_DISPLAY_LABEL } from "@/constants/club";
import { formatKickoffLongNl } from "@/lib/utils/format-date";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

type CountdownSnapshot = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

function computeSnapshot(targetMs: number): CountdownSnapshot {
  const ms = Math.max(0, targetMs - Date.now());
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor((ms % 86400000) / 3600000),
    minutes: Math.floor((ms % 3600000) / 60000),
    seconds: Math.floor((ms % 60000) / 1000),
    expired: ms <= 0,
  };
}

/** Tijd alleen na mount (useEffect); eerste paint = statische placeholders → geen hydration mismatch. */
const MatchCountdownTickSection = memo(function MatchCountdownTickSection({
  kickoffIso,
  kickoffLabel,
  opponent,
  reduceMotion,
}: {
  kickoffIso: string;
  kickoffLabel: string;
  opponent: string;
  reduceMotion: boolean;
}) {
  const target = useMemo(() => new Date(kickoffIso).getTime(), [kickoffIso]);
  const [mounted, setMounted] = useState(false);
  const [snapshot, setSnapshot] = useState<CountdownSnapshot | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const tick = () => setSnapshot(computeSnapshot(target));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [mounted, target]);

  const labels = ["DAGEN", "UREN", "MIN", "SEC"] as const;
  const values: [string, string, string, string] = snapshot
    ? [pad(snapshot.days), pad(snapshot.hours), pad(snapshot.minutes), pad(snapshot.seconds)]
    : ["--", "--", "--", "--"];

  const expired = snapshot?.expired ?? false;
  const showBlocks = !snapshot || !expired;

  const homeName = TEAM_DISPLAY_LABEL;

  return (
    <>
      <div className="relative px-5 py-8 sm:px-8 md:px-10 md:py-10">
        <div className="text-center">
          <p className="break-words font-[family-name:var(--font-display)] text-[clamp(1.7rem,5vw,3rem)] leading-[0.98] tracking-[0.03em] text-white">
            {homeName} <span className="mx-2 text-blue-200/85">vs</span> {opponent}
          </p>
          <p className="mt-3 text-sm font-semibold text-blue-100/90">{kickoffLabel}</p>
        </div>

        {showBlocks ? (
          <div className="mx-auto mt-8 flex max-w-3xl items-start justify-center gap-1 sm:mt-10 sm:gap-2 md:gap-3">
            {labels.map((label, i) => (
              <div key={label} className="flex items-start">
                <div className="relative min-w-[4.4rem] px-1 py-2 text-center sm:min-w-[5.2rem] md:min-w-[6rem]">
                  <p className="font-[family-name:var(--font-display)] text-[clamp(2rem,7vw,3.4rem)] tabular-nums leading-none tracking-[0.04em] text-white">
                    {values[i]}
                  </p>
                  <div className="mt-2 flex min-h-[6px] items-center justify-center">
                    {mounted && i === 3 && snapshot && !snapshot.expired && !reduceMotion ? (
                      <span className="block h-0.5 w-10 animate-pulse rounded-full bg-blue-300/70" aria-hidden />
                    ) : null}
                  </div>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100/90">{label}</p>
                </div>
                {i < labels.length - 1 ? (
                  <span className="mt-1 font-[family-name:var(--font-display)] text-[clamp(1.6rem,4vw,2.2rem)] text-blue-200/70">:</span>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {mounted && expired ? (
        <p className="border-t border-white/12 bg-black/20 px-5 py-4 text-center text-sm text-blue-100/90 sm:px-10">
          De aftrap is geweest.
        </p>
      ) : null}
    </>
  );
});

export function MatchCountdown({
  kickoffIso,
  opponent,
  isHome,
  matchId,
  seasonId,
}: {
  kickoffIso: string;
  opponent: string;
  isHome: boolean;
  matchId: string;
  seasonId: string;
}) {
  const kickoffLabel = useMemo(() => formatKickoffLongNl(kickoffIso), [kickoffIso]);

  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const detailHref = `/wedstrijden/${matchId}?season=${encodeURIComponent(seasonId)}`;

  return (
    <section
      id="wedstrijd-focus"
      className="scroll-mt-28 relative overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-br from-[#020817] via-[#0b1f5f] to-[#153ea8] text-white shadow-[0_20px_48px_rgba(15,23,42,0.28)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgba(147,197,253,0.2),transparent_72%)]" />
      <div className="relative flex flex-col gap-3 border-b border-white/12 px-5 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-8 md:px-10 md:py-5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" aria-hidden />
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-blue-100/85">VOLGENDE WEDSTRIJD</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <span className="rounded-xl border border-white/22 bg-white/14 px-3.5 py-2 text-[11px] font-bold text-white">Gepland</span>
          <span className="rounded-xl border border-white/22 bg-white/10 px-3.5 py-2 text-[11px] font-bold text-white/90">
            {isHome ? "Thuis" : "Uit"}
          </span>
        </div>
      </div>

      <MatchCountdownTickSection
        kickoffIso={kickoffIso}
        kickoffLabel={kickoffLabel}
        opponent={opponent}
        reduceMotion={reduceMotion}
      />

      <div className="border-t border-white/12 bg-black/15 px-5 py-5 sm:px-8 md:px-10 md:py-6">
        <Link
          href={detailHref}
          prefetch
          className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-white text-center text-[15px] font-bold tracking-wide text-[#0b1f5f] shadow-md transition-colors hover:bg-blue-50"
        >
          Naar wedstrijddetail
        </Link>
      </div>
    </section>
  );
}
