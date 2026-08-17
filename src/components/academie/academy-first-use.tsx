"use client";

import Link from "next/link";
import { AcademyPrimaryCta } from "@/components/academie/academy-primary-cta";
import { FormationTeachSequence } from "@/components/academie/formation-teach-sequence";
import { PerspectiveSetupStrip } from "@/components/academie/perspective-setup-strip";
import type { AcademyCtaLabel } from "@/lib/decision-lab/academy-visibility";
import { sessionDistinctLabel } from "@/lib/decision-lab/academy-visibility";
import { getBlokForSession } from "@/lib/decision-lab/missions";
import { listDecisionLabSessions } from "@/lib/decision-lab/session-catalog";
import type { DecisionLabSession } from "@/lib/decision-lab/types";

export function AcademyFirstUseExperience({
  primary,
  ctaLabel,
  nextTwo,
}: {
  primary: DecisionLabSession;
  ctaLabel: AcademyCtaLabel;
  nextTwo: DecisionLabSession[];
}) {
  const blok = getBlokForSession(primary);
  const href = `/academie/decision-lab/${primary.slug}`;

  return (
    <div className="w-full space-y-5 md:space-y-10" data-testid="academy-first-use">
      <header className="space-y-1.5 md:space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zvv-primary">
          Football Academy
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(1.75rem,5vw,3rem)] leading-[0.98] tracking-wide text-zvv-ink">
          Je eerste beslissessie
        </h1>
        <p className="hidden max-w-2xl text-base text-zvv-muted sm:block md:text-lg">
          Train je keuzes. Begrijp je rol. Speel als team.
        </p>
      </header>

      <PerspectiveSetupStrip />
      <p className="hidden text-sm font-medium text-zvv-ink sm:block">
        Wij spelen vanuit een <span className="font-semibold">4-2-3-1</span>.
      </p>

      <section
        className="overflow-hidden rounded-[1.75rem] bg-zvv-night px-4 py-5 text-white shadow-zvv-hero sm:px-6 sm:py-6 md:px-8 md:py-7"
        aria-labelledby="first-decision-heading"
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)] lg:gap-8">
          <div className="flex min-w-0 flex-col gap-4 order-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200/85">
                Eerste beslissing
              </p>
              <h2
                id="first-decision-heading"
                className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.45rem,3.5vw,2.35rem)] leading-[1.05] tracking-wide sm:mt-3"
              >
                {primary.playerTitle}
              </h2>
              <p className="mt-2 text-sm text-blue-100/90 sm:mt-3 sm:text-base">
                Hun back krijgt de bal. Wat sluit jij eerst?
              </p>
              <dl className="mt-3 hidden grid-cols-3 gap-2 text-sm text-blue-50/95 sm:mt-4 sm:grid">
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-blue-200/70">
                    Rol
                  </dt>
                  <dd className="mt-0.5 font-semibold">RW</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-blue-200/70">
                    Duur
                  </dt>
                  <dd className="mt-0.5 font-semibold">
                    {primary.durationMin}–{primary.durationMax} min
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-blue-200/70">
                    Niveau
                  </dt>
                  <dd className="mt-0.5 font-semibold">{primary.difficulty}</dd>
                </div>
              </dl>
            </div>
            <AcademyPrimaryCta
              href={href}
              label={ctaLabel}
              icon="play"
              tone="on-dark"
              durationHint={`${primary.durationMin}–${primary.durationMax} min · ${blok?.title ?? "Druk herkennen"}`}
              className="w-full"
            />
          </div>
          <div className="order-2 min-w-0">
            <FormationTeachSequence large />
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t border-zvv-border pt-8" aria-labelledby="below-fold-heading">
        <h2
          id="below-fold-heading"
          className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink"
        >
          Wat gebeurt er in een sessie?
        </h2>
        <ol className="grid gap-3 text-base text-zvv-ink sm:grid-cols-3">
          <li className="rounded-2xl bg-slate-50 px-4 py-3.5">
            <span className="font-semibold">1. Bekijk</span>
            <p className="mt-1 text-sm text-zvv-muted">Zie de situatie op het veld.</p>
          </li>
          <li className="rounded-2xl bg-slate-50 px-4 py-3.5">
            <span className="font-semibold">2. Beslis</span>
            <p className="mt-1 text-sm text-zvv-muted">Kies wat jij eerst doet.</p>
          </li>
          <li className="rounded-2xl bg-slate-50 px-4 py-3.5">
            <span className="font-semibold">3. Zie het gevolg</span>
            <p className="mt-1 text-sm text-zvv-muted">Goed of fout — en waarom.</p>
          </li>
        </ol>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zvv-primary">Leerpad</p>
            <p className="mt-1 text-lg font-semibold text-zvv-ink">Decision Lab</p>
            <p className="text-sm text-zvv-muted">
              {listDecisionLabSessions().length} sessies · actief
            </p>
          </div>
          <Link
            href="/academie/decision-lab"
            className="inline-flex min-h-11 items-center rounded-full border border-zvv-border bg-white px-5 text-sm font-semibold text-zvv-ink hover:border-zvv-primary/40"
          >
            Open Decision Lab
          </Link>
        </div>

        {nextTwo.length > 0 ? (
          <div>
            <p className="text-sm font-semibold text-zvv-ink">Daarna in de route</p>
            <ul className="mt-2 space-y-2">
              {nextTwo.map((s) => (
                <li key={s.id} className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-zvv-muted">
                  <span className="font-medium text-zvv-ink">{sessionDistinctLabel(s, primary)}</span>
                  <span className="mt-0.5 block text-xs">
                    {s.durationMin}–{s.durationMax} min · {s.difficulty}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}
