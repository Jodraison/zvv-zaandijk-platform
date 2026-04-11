"use client";

import Link from "next/link";
import { PhotoOrFallback } from "@/components/media/photo-with-fallback";
import { TEAM_DISPLAY_LABEL, TEAM_DISPLAY_LABEL_UPPER } from "@/constants/club";

const LOCAL_TEAM_FALLBACK = "/team.jpg";

function TeamPhotoUnavailable() {
  return (
    <div className="flex min-h-[min(42vh,340px)] flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-50 to-blue-50 px-6 text-center md:min-h-[min(45vh,380px)] md:px-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zvv-primary/20 bg-white text-3xl shadow-sm md:h-16 md:w-16" aria-hidden>
        📷
      </div>
      <p className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink md:text-3xl">Teamfoto binnenkort</p>
      <p className="max-w-md text-[15px] leading-relaxed text-zvv-muted">
        Zodra de nieuwe teamfoto live staat, verschijnt hij hier groot en strak in clubstijl.
      </p>
    </div>
  );
}

function q(seasonId: string) {
  return `?season=${encodeURIComponent(seasonId)}`;
}

export function TeamPhotoBlock({ dbUrl, seasonId }: { dbUrl: string | null; seasonId: string }) {
  return (
    <section className="w-full" aria-labelledby="team-photo-heading">
      <div className="mx-auto max-w-[110rem]">
        <figure className="group relative overflow-hidden rounded-2xl shadow-[0_30px_80px_rgba(15,23,42,0.22)] md:rounded-[2.25rem]">
          <figcaption className="sr-only">Onze selectie: een team, een standaard</figcaption>
          <div className="relative aspect-[16/11] min-h-[320px] w-full bg-zvv-card-mid sm:aspect-[16/10] sm:min-h-[380px] md:aspect-[16/8] md:min-h-[480px] lg:min-h-[520px]">
            <PhotoOrFallback
              url={dbUrl}
              secondaryUrl={LOCAL_TEAM_FALLBACK}
              alt={`Teamfoto ${TEAM_DISPLAY_LABEL}`}
              className="object-cover object-center transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 1760px"
              priority
              fallback={<TeamPhotoUnavailable />}
            />
            {/* Rustige overlay: minder hoog op mobiel zodat de foto ademt */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] bg-gradient-to-t from-zvv-ink/75 via-zvv-ink/28 to-transparent md:h-[46%]" />

            <div className="absolute inset-x-0 bottom-0 p-5 md:p-10 lg:p-12">
              <div className="max-w-3xl text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-blue-100/88 md:text-[11px] md:tracking-[0.28em]">
                  Clubidentiteit
                </p>
                <h2
                  id="team-photo-heading"
                  className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2rem,9vw,5rem)] leading-[0.92] tracking-[0.03em] md:mt-4"
                >
                  {TEAM_DISPLAY_LABEL_UPPER}
                </h2>
                <p className="mt-2 max-w-md text-[clamp(0.9rem,3.5vw,1.35rem)] font-semibold tracking-[0.06em] text-blue-100 md:tracking-[0.08em]">
                  EEN TEAM. EEN STANDAARD.
                </p>
                <div className="mt-6 md:mt-7">
                  <Link
                    href={`/selectie${q(seasonId)}`}
                    className="club-btn-primary club-btn-primary-sm inline-flex min-h-[48px] items-center justify-center bg-white text-zvv-blue-deep hover:bg-white/95"
                  >
                    Naar selectie
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </figure>
      </div>
    </section>
  );
}
