import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { buildTrainingPerformanceCenter, publicTrainingPerformanceView } from "@/lib/training/training-performance";
import { SessionTrendList } from "@/components/training/session-trend-list";
import { PlayerAttendanceRank } from "@/components/training/player-attendance-rank";
import { AbsenceCategoryBars } from "@/components/training/absence-category-bars";

type Props = { searchParams: Promise<{ season?: string }> };

function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <article className="rounded-2xl border border-zvv-border bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zvv-primary">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-3xl tracking-wide text-zvv-ink">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-zvv-muted">{hint}</p> : null}
    </article>
  );
}

export default async function TrainingPage({ searchParams }: Props) {
  const sp = await searchParams;
  const db = await readDb();
  const seasonId = await readResolvedSeasonId(db, sp.season);
  const season = db.seasons.find((s) => s.id === seasonId);
  const view = publicTrainingPerformanceView(buildTrainingPerformanceCenter(db, seasonId));
  const { kpis, trend, ranking, absenceTotals } = view;

  return (
    <div className="space-y-8">
      <header className="club-section-surface club-reveal">
        <p className="club-page-eyebrow">Training</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,3.2rem)] tracking-wide text-zvv-ink">
          Trainingsprestaties
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zvv-muted">
          Opkomst, beschikbaarheid en continuïteit door het seizoen.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Trainingen" value={String(kpis.registeredSessions)} hint="Geregistreerd" />
        <KpiCard label="Gemiddelde opkomst" value={`${kpis.averagePct}%`} />
        <KpiCard label="Hoogste opkomst" value={`${kpis.highestPct}%`} />
        <KpiCard label="Actieve reeks" value={String(kpis.activeStreak)} hint="Trainingen op rij" />
      </section>

      <section className="rounded-2xl border border-zvv-border bg-white p-5 shadow-sm">
        <p className="club-page-eyebrow">Opkomst</p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">
          Opkomst per training
        </h2>
        <div className="mt-4">
          <SessionTrendList rows={trend} />
        </div>
      </section>

      <section className="rounded-2xl border border-zvv-border bg-white p-5 shadow-sm">
        <p className="club-page-eyebrow">Selectie</p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">
          Aanwezigheidsranglijst
        </h2>
        <p className="mt-1 text-sm text-zvv-muted">Alleen opkomst. Geen persoonlijke afwezigheidsredenen.</p>
        <div className="mt-4">
          <PlayerAttendanceRank rows={ranking} />
        </div>
      </section>

      <section className="rounded-2xl border border-zvv-border bg-white p-5 shadow-sm">
        <p className="club-page-eyebrow">Afwezigheid</p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">
          Redenen dit seizoen
        </h2>
        <p className="mt-1 text-sm text-zvv-muted">Teamtotalen. Geen namen, geen medische details.</p>
        <div className="mt-4">
          <AbsenceCategoryBars counts={absenceTotals} />
        </div>
      </section>

      <section className="rounded-2xl border border-zvv-border bg-gradient-to-br from-white to-zvv-card-mid/30 p-5 shadow-sm">
        <p className="club-page-eyebrow">Seizoen</p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">
          {season?.name ?? "Seizoen"}
        </h2>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-3 border-b border-zvv-border/70 py-1.5">
            <dt className="text-zvv-muted">Trainingen gepland</dt>
            <dd className="font-semibold tabular-nums text-zvv-ink">{kpis.plannedSessions}</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-zvv-border/70 py-1.5">
            <dt className="text-zvv-muted">Geregistreerd</dt>
            <dd className="font-semibold tabular-nums text-zvv-ink">{kpis.registeredSessions}</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-zvv-border/70 py-1.5">
            <dt className="text-zvv-muted">Gemiddelde aanwezigheid</dt>
            <dd className="font-semibold tabular-nums text-zvv-ink">{kpis.averagePct}%</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-zvv-border/70 py-1.5">
            <dt className="text-zvv-muted">Speelsters ≥ 75%</dt>
            <dd className="font-semibold tabular-nums text-zvv-ink">{kpis.playersAtLeast75}</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-zvv-border/70 py-1.5">
            <dt className="text-zvv-muted">Afwezigheidsmomenten</dt>
            <dd className="font-semibold tabular-nums text-zvv-ink">{kpis.absenceMoments}</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-zvv-border/70 py-1.5">
            <dt className="text-zvv-muted">Zonder reden</dt>
            <dd className="font-semibold tabular-nums text-zvv-ink">{kpis.withoutReasonCount}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
