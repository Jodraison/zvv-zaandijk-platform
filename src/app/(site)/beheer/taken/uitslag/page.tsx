import Link from "next/link";
import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { AdminPageHeader } from "@/components/admin/shell/admin-ui";
import { formatHumanDateNL } from "@/lib/utils/format-date";
import { withSeason } from "@/lib/admin/beheer-nav";

type Props = { searchParams: Promise<{ season?: string }> };

export default async function TaakUitslagPage({ searchParams }: Props) {
  const sp = await searchParams;
  const db = await readDb();
  const seasonId = await readResolvedSeasonId(db, sp.season);
  const matches = db.matches
    .filter((m) => m.season_id === seasonId)
    .filter(
      (m) =>
        m.status === "played" ||
        (m.status === "scheduled" && new Date(m.kickoff_at).getTime() < Date.now()),
    )
    .sort((a, b) => b.kickoff_at.localeCompare(a.kickoff_at));

  const incomplete = matches.filter(
    (m) => m.integrity_state !== "verified" || m.goals_for == null || m.goals_against == null,
  );
  const ordered = [...incomplete, ...matches.filter((m) => !incomplete.includes(m))];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Uitslag invoeren"
        description="Speelsterscores, doelpunten, assists en MVP voor gespeelde of verlopen wedstrijden. Geen fictieve wedstrijden aanmaken."
        actions={
          <Link href={withSeason("/beheer", seasonId)} className="club-btn-secondary club-btn-primary-sm">
            Terug
          </Link>
        }
      />

      {ordered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zvv-border bg-white p-6 text-sm text-zvv-muted">
          Er is nog geen wedstrijd om een uitslag voor in te voeren. Het officiële programma volgt later.
        </div>
      ) : (
        <ul className="space-y-2">
          {ordered.map((m) => {
            const needsWork = m.integrity_state !== "verified";
            return (
              <li key={m.id}>
                <Link
                  href={withSeason(`/beheer/wedstrijden/${m.id}`, seasonId)}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zvv-border bg-white px-4 py-4 transition hover:border-zvv-primary/40"
                >
                  <div>
                    <p className="font-[family-name:var(--font-display)] text-xl text-zvv-ink">
                      {m.is_home ? "Zaandijk" : m.opponent} {m.is_home ? "–" : "@"} {m.is_home ? m.opponent : "Zaandijk"}
                    </p>
                    <p className="mt-1 text-sm text-zvv-muted">
                      {formatHumanDateNL(m.kickoff_at, { includeYear: true })}
                      {m.goals_for != null && m.goals_against != null
                        ? ` · Stand ${m.goals_for}-${m.goals_against}`
                        : " · Nog geen score"}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-zvv-primary">
                    {needsWork ? "Uitslag aanvullen" : "Bekijken / corrigeren"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
