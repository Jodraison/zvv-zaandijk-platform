"use client";

import Link from "next/link";
import type { PlayerSeasonRankingRow } from "@/types";
import { PhotoOrFallback } from "@/components/media/photo-with-fallback";
import { TEAM_DISPLAY_LABEL } from "@/constants/club";

export function ClubMomentsGrid({
  teamPhotoUrl,
  rows,
}: {
  teamPhotoUrl: string | null;
  rows: PlayerSeasonRankingRow[];
}) {
  const images = [teamPhotoUrl, ...rows.map((r) => r.photo_url)].filter(Boolean).slice(0, 8) as string[];
  if (!images.length) return null;

  return (
    <section className="mx-auto max-w-[110rem] px-4 md:px-8" aria-labelledby="moments-heading">
      <header className="mb-8 text-center md:mb-10 md:text-left">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-zvv-primary">Dit is Zaandijk</p>
        <h2
          id="moments-heading"
          className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2.2rem,4.8vw,3.8rem)] leading-[0.95] tracking-wide text-zvv-ink"
        >
          Niet alleen een team. Een groep die alles samen doet.
        </h2>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {images.map((url, index) => (
          <article key={`${url}-${index}`} className={index % 5 === 0 ? "md:col-span-2" : ""}>
            <div className="group relative overflow-hidden rounded-2xl bg-zvv-card-mid shadow-[0_16px_40px_rgba(15,23,42,0.14)]">
              <div className={index % 5 === 0 ? "relative aspect-[16/10]" : "relative aspect-square"}>
                <PhotoOrFallback
                  url={url}
                  alt={`Teammoment ${TEAM_DISPLAY_LABEL}`}
                  className="object-cover object-center transition-transform duration-200 ease-out motion-safe:group-hover:scale-[1.01]"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  fallback={<span className="font-[family-name:var(--font-display)] text-4xl text-zvv-primary/35">ZVV</span>}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/48 via-transparent to-transparent" />
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 text-center md:text-left">
        <Link
          href="https://instagram.com/zaandijkzaterdagdames1"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-xl bg-zvv-blue-deep px-6 py-3 text-sm font-semibold tracking-wide text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-zvv-primary"
        >
          Volg het team op Instagram
        </Link>
      </div>
    </section>
  );
}
