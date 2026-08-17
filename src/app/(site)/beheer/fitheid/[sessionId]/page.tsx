import Link from "next/link";
import { notFound } from "next/navigation";
import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { AdminPageHeader } from "@/components/admin/shell/admin-ui";
import { FITNESS_COMPONENTS } from "@/lib/fitness/protocol";
import { sessionProgress } from "@/lib/fitness/completeness";
import { formatDateNL } from "@/lib/utils/format-date";
import { cn } from "@/lib/utils";
import { FitnessSessionMetaForm } from "@/components/admin/fitness/fitness-session-meta-form";
import { canDeleteFitnessSession } from "@/lib/fitness/fitness-session-admin";

type Props = {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ season?: string }>;
};

const STATION_ICONS: Record<string, string> = {
  sprint: "⚡",
  agility: "↺",
  plank: "━",
  run: "↗",
};

export default async function BeheerFitheidTestdagPage({ params, searchParams }: Props) {
  const { sessionId } = await params;
  const sp = await searchParams;
  const db = await readDb();
  const seasonId = await readResolvedSeasonId(db, sp.season);
  const session = db.fitness_test_sessions.find((s) => s.id === sessionId);
  if (!session || session.season_id !== seasonId) notFound();

  const q = `?season=${encodeURIComponent(seasonId)}`;
  const members = db.player_season_memberships
    .filter((m) => m.season_id === seasonId)
    .map((m) => {
      const p = db.players.find((x) => x.id === m.player_id);
      return {
        player_id: m.player_id,
        name: p?.full_name ?? "—",
        shirt_number: m.shirt_number,
        is_guest: p?.is_guest ?? false,
      };
    })
    .filter((m) => !m.is_guest)
    .sort((a, b) => (a.shirt_number ?? 999) - (b.shirt_number ?? 999));

  const results = db.fitness_test_results.filter((r) => r.session_id === sessionId);
  const rows = members.map((m) => {
    const r = results.find((x) => x.player_id === m.player_id);
    return {
      flying_sprint_30m_seconds: r?.flying_sprint_30m_seconds ?? null,
      agility_10_20_10_seconds: r?.agility_10_20_10_seconds ?? null,
      plank_seconds: r?.plank_seconds ?? null,
      six_minute_run_meters: r?.six_minute_run_meters ?? null,
      participation_status: r?.participation_status,
    };
  });
  const progress = sessionProgress(rows, members.length);
  const locked = session.status === "published";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Fitheidstest"
        title={`Fitheidstest · ${formatDateNL(session.test_on)}`}
        description={`${progress.complete} van ${progress.expectedPlayers} speelsters volledig${
          locked ? " · Definitief" : " · Concept — kies Sprint om te starten"
        }`}
        actions={
          <>
            {!locked ? (
              <Link
                href={`/beheer/fitheid/${sessionId}/station/sprint${q}`}
                className="club-btn-primary club-btn-primary-sm"
              >
                Verder met invoeren
              </Link>
            ) : null}
            <Link href={`/beheer/fitheid/${sessionId}/controle${q}`} className="club-btn-secondary club-btn-primary-sm">
              Controleren
            </Link>
            {locked ? (
              <Link href={`/beheer/fitheid/${sessionId}/resultaten${q}`} className="club-btn-primary club-btn-primary-sm">
                Resultaten bekijken
              </Link>
            ) : null}
          </>
        }
      />

      <FitnessSessionMetaForm
        sessionId={session.id}
        seasonId={seasonId}
        initialTestOn={session.test_on}
        initialNote={session.note}
        canDelete={canDeleteFitnessSession(session)}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {FITNESS_COMPONENTS.map((c) => {
          const filled = progress.byComponent[c.key];
          const done = filled >= progress.expectedPlayers && progress.expectedPlayers > 0;
          const unit =
            c.unit === "m" ? "meters" : c.unit === "plank" ? "min:sec" : "seconden";
          return (
            <article
              key={c.key}
              className={cn(
                "flex flex-col rounded-2xl border bg-white p-4 shadow-sm",
                done ? "border-emerald-300" : "border-zvv-border",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-2xl" aria-hidden>
                  {STATION_ICONS[c.tabId]}
                </span>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-xs font-semibold",
                    done
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : filled > 0
                        ? "border-amber-200 bg-amber-50 text-amber-900"
                        : "border-zvv-border bg-zvv-card-mid text-zvv-muted",
                  )}
                >
                  {done ? "Klaar" : filled > 0 ? "Bezig" : "Open"}
                </span>
              </div>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl text-zvv-ink">{c.shortLabel}</h2>
              <p className="mt-1 text-sm text-zvv-muted">{c.label}</p>
              <p className="mt-3 font-[family-name:var(--font-display)] text-xl text-zvv-ink">
                {filled} / {progress.expectedPlayers} ingevuld
              </p>
              <p className="text-sm text-zvv-muted">Eenheid: {unit}</p>
              <div className="mt-auto pt-4">
                <Link
                  href={`/beheer/fitheid/${sessionId}/station/${c.tabId}${q}`}
                  className="club-btn-primary club-btn-primary-sm inline-flex"
                >
                  Station openen
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <p className="text-sm text-zvv-muted">
        Vier aparte stations — geen totale tijd. Voer per station alle speelsters in met Enter naar de volgende.
      </p>
    </div>
  );
}
