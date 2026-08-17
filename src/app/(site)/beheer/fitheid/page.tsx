import Link from "next/link";
import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { AdminEmptyState, AdminMetric, AdminPageHeader, AdminSection } from "@/components/admin/shell/admin-ui";
import { derivePlayerCompleteness } from "@/lib/fitness/completeness";
import { FITNESS_COMPONENTS } from "@/lib/fitness/protocol";
import { formatHumanDateNL } from "@/lib/utils/format-date";
import { getSeasonOperations } from "@/lib/season/season-operations-2026-27";
import { nextFitnessMoment } from "@/lib/operations/next-events";
import { activeSeasonMemberCount } from "@/lib/players/season-squad";

type Props = { searchParams: Promise<{ season?: string }> };

export default async function BeheerFitheidPage({ searchParams }: Props) {
  const sp = await searchParams;
  const db = await readDb();
  const seasonId = await readResolvedSeasonId(db, sp.season);
  const q = `?season=${encodeURIComponent(seasonId)}`;
  const ops = getSeasonOperations(seasonId);
  const next = nextFitnessMoment(db, seasonId);
  const activeCount = activeSeasonMemberCount(db, seasonId);

  const sessions = db.fitness_test_sessions
    .filter((s) => s.season_id === seasonId && s.protocol_code === "four_part_v1")
    .sort((a, b) => b.test_on.localeCompare(a.test_on) || b.updated_at.localeCompare(a.updated_at));

  const drafts = sessions.filter((s) => s.status === "draft");
  const latest = sessions[0] ?? null;
  const latestResults = latest ? db.fitness_test_results.filter((r) => r.session_id === latest.id) : [];
  const latestComplete = latestResults.filter((r) => derivePlayerCompleteness(r) === "complete").length;

  const prepareHref =
    next.kind === "draft" && next.plannedSession
      ? `/beheer/fitheid/${next.plannedSession.id}/station/sprint${q}`
      : `/beheer/fitheid/nieuw${q}`;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Fitheid"
        description="Vier stations · één waarde per speelster · pas publiceren na controle."
        actions={
          <>
            <Link href={`/beheer/fitheid/nieuw${q}`} className="club-btn-primary club-btn-primary-sm">
              + Nieuw testmoment
            </Link>
            <Link href={prepareHref} className="club-btn-secondary club-btn-primary-sm">
              Test voorbereiden
            </Link>
          </>
        }
        metrics={
          <div className="grid w-full gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <AdminMetric
              label="Eerstvolgende test"
              value={next.date ? formatHumanDateNL(next.date, { includeYear: true }) : "—"}
              hint={
                next.kind === "draft"
                  ? "Concept"
                  : next.kind === "planned_config"
                    ? "Eerste meting"
                    : next.kind === "expected"
                      ? "Verwacht"
                      : "Nog plannen"
              }
            />
            <AdminMetric label="Actieve speelsters" value={String(activeCount)} hint="In selectie 2026/27" />
            <AdminMetric
              label="Status"
              value={drafts.length ? "Concept open" : latest?.status === "published" ? "Laatste is definitief" : "Nog geen meting"}
              hint={latest ? formatHumanDateNL(latest.test_on) : undefined}
            />
            <AdminMetric
              label="Volledig in laatste"
              value={latest ? `${latestComplete}/${latestResults.length}` : "—"}
              hint="Speelsters met alle vier waarden"
            />
          </div>
        }
      />

      <AdminSection title="Vier stations" description="Klik een station om direct in te voeren. Tab/Enter ondersteund.">
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {FITNESS_COMPONENTS.map((c) => {
            const stationHref =
              drafts[0]
                ? `/beheer/fitheid/${drafts[0]!.id}/station/${c.tabId}${q}`
                : latest && latest.status === "draft"
                  ? `/beheer/fitheid/${latest.id}/station/${c.tabId}${q}`
                  : `/beheer/fitheid/nieuw${q}&station=${c.tabId}`;
            return (
              <li key={c.key}>
                <Link
                  href={stationHref}
                  className="block rounded-xl border border-zvv-border bg-white px-3 py-3 transition hover:border-zvv-primary/40 hover:bg-zvv-primary-muted/30"
                >
                  <p className="font-semibold text-zvv-ink">{c.shortLabel}</p>
                  <p className="mt-1 text-sm text-zvv-muted">{c.label}</p>
                  <p className="mt-2 text-sm font-semibold text-zvv-primary">
                    {drafts[0] || (latest && latest.status === "draft") ? "Open invoer →" : "Test starten →"}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </AdminSection>

      <AdminSection title="Testmomenten">
        {sessions.length === 0 ? (
          <AdminEmptyState
            title="Nog geen uitslagen"
            description={
              ops
                ? `Eerste meting gepland op ${formatHumanDateNL(ops.fitness.firstTestOn, { includeYear: true })}. Ranglijsten verschijnen pas na publicatie.`
                : "Maak een concept, vul stations in en publiceer pas na controle."
            }
            action={
              <Link href={`/beheer/fitheid/nieuw${q}`} className="club-btn-primary club-btn-primary-sm">
                Test voorbereiden
              </Link>
            }
          />
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => {
              const results = db.fitness_test_results.filter((r) => r.session_id === s.id);
              const complete = results.filter((r) => derivePlayerCompleteness(r) === "complete").length;
              const href =
                s.status === "published"
                  ? `/beheer/fitheid/${s.id}/resultaten${q}`
                  : `/beheer/fitheid/${s.id}`;
              return (
                <li key={s.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zvv-border bg-white px-4 py-3">
                    <div>
                      <p className="font-[family-name:var(--font-display)] text-xl text-zvv-ink">
                        {formatHumanDateNL(s.test_on, { includeYear: true })}
                      </p>
                      <p className="text-sm text-zvv-muted">
                        {s.status === "published" ? "Definitief" : "Concept"} · {complete}/{results.length} volledig
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link href={href} className="text-sm font-semibold text-zvv-primary underline">
                        Testmoment openen
                      </Link>
                      <Link
                        href={`/beheer/fitheid/${s.id}${q}`}
                        className="text-sm font-semibold text-zvv-primary underline"
                      >
                        Testmoment wijzigen
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminSection>

      <p className="text-sm text-zvv-muted">
        Archief oude 20-40-60 sprinttesten:{" "}
        <Link href={`/beheer/fitheid/legacy${q}`} className="font-medium text-zvv-primary underline">
          historisch archief
        </Link>
        . Dit is geen actuele ranking.
      </p>
    </div>
  );
}
