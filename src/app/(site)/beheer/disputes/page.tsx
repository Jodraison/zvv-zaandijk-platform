import Link from "next/link";
import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { buildPlayerDisputeBreakdown } from "@/lib/queries/player-dispute-breakdown";
import { requireAdmin } from "@/lib/auth/require-admin";
import { formatDateNL } from "@/lib/utils/format-date";
import { AdminPageHeader, AdminSection } from "@/components/admin/shell/admin-ui";

type Props = {
  searchParams: Promise<{ player?: string; season?: string }>;
};

export default async function DisputesPage({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;
  const db = await readDb();
  const playerId = (sp.player ?? "").trim();
  const seasonId = await readResolvedSeasonId(db, sp.season);

  const players = [...db.players].sort((a, b) => a.full_name.localeCompare(b.full_name, "nl"));
  const selected = players.find((p) => p.id === playerId) ?? null;

  const breakdown = selected ? buildPlayerDisputeBreakdown(db, selected.id, seasonId) : null;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Beheer · Controle"
        title="Correcties"
        description="Zoek een speelster, bekijk alle bronwedstrijden, open direct de wedstrijd-editor voor correctie en hercontrole."
      />

      <AdminSection title="Speelster kiezen">
        <form className="rounded-xl border border-zvv-border bg-white p-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-zvv-muted">Speelster</label>
          <div className="mt-2 flex gap-2">
            <input type="hidden" name="season" value={seasonId} />
            <select
              name="player"
              defaultValue={playerId}
              className="min-h-[44px] flex-1 rounded-xl border border-zvv-border bg-white px-3"
            >
              <option value="">Kies speelster</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
            <button type="submit" className="club-btn-primary">
              Zoek
            </button>
          </div>
        </form>
      </AdminSection>

      {selected ? (
        <AdminSection title={`Overzicht — ${selected.full_name}`}>
          <div className="space-y-4 rounded-xl border border-zvv-border bg-white p-4">
            <div className="rounded-xl border border-zvv-border bg-zvv-card-mid p-4">
              <p className="text-sm font-semibold text-zvv-ink">{selected.full_name}</p>
              <p className="mt-1 text-xs text-zvv-muted">
                Statistieken op basis van doelpunt-gebeurtenissen en MVP per wedstrijd (seizoen:{" "}
                {seasonId.slice(0, 8)}…)
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-zvv-border bg-white p-3 text-xs">
                  <p className="text-zvv-muted">Doelpunten totaal</p>
                  <p className="text-xl font-bold text-zvv-ink">{breakdown?.goals_total ?? 0}</p>
                </div>
                <div className="rounded-lg border border-zvv-border bg-white p-3 text-xs">
                  <p className="text-zvv-muted">Assists totaal</p>
                  <p className="text-xl font-bold text-zvv-ink">{breakdown?.assists_total ?? 0}</p>
                </div>
                <div className="rounded-lg border border-zvv-border bg-white p-3 text-xs">
                  <p className="text-zvv-muted">MVP totaal</p>
                  <p className="text-xl font-bold text-zvv-ink">{breakdown?.mvp_total ?? 0}</p>
                </div>
                <div className="rounded-lg border border-zvv-border bg-white p-3 text-xs">
                  <p className="text-zvv-muted">Bijdragende wedstrijden</p>
                  <p className="text-xl font-bold text-zvv-ink">{breakdown?.matches_contributing ?? 0}</p>
                </div>
              </div>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-zvv-card-mid text-xs uppercase tracking-wide text-zvv-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">Datum</th>
                    <th className="px-3 py-2 text-left">Wedstrijd</th>
                    <th className="px-3 py-2 text-center">Resultaat</th>
                    <th className="px-3 py-2 text-right">Doelpunten</th>
                    <th className="px-3 py-2 text-right">Assists</th>
                    <th className="px-3 py-2 text-right">MVP</th>
                    <th className="px-3 py-2 text-right">Gast</th>
                    <th className="px-3 py-2 text-right">Actie</th>
                  </tr>
                </thead>
                <tbody>
                  {(breakdown?.rows ?? []).map((r) => (
                    <tr key={r.match_id} className="border-t border-zvv-border align-top">
                      <td className="px-3 py-2">{formatDateNL(r.kickoff_at)}</td>
                      <td className="px-3 py-2">
                        {r.is_home ? "Thuis" : "Uit"} · {r.opponent}
                      </td>
                      <td className="px-3 py-2 text-center">{r.result}</td>
                      <td className="px-3 py-2 text-right">{r.goals}</td>
                      <td className="px-3 py-2 text-right">{r.assists}</td>
                      <td className="px-3 py-2 text-right">{r.is_mvp ? "Ja" : "—"}</td>
                      <td className="px-3 py-2 text-right">{r.is_guest_involved ? "Ja" : "—"}</td>
                      <td className="px-3 py-2 text-right">
                        <Link
                          className="club-btn-secondary"
                          href={`/beheer/wedstrijden/${r.match_id}?season=${encodeURIComponent(seasonId)}&returnTo=${encodeURIComponent(`/beheer/disputes?season=${encodeURIComponent(seasonId)}&player=${encodeURIComponent(selected.id)}`)}`}
                        >
                          Bewerk wedstrijd
                        </Link>
                        <details className="mt-2 text-left">
                          <summary className="cursor-pointer text-xs font-semibold text-zvv-muted hover:text-zvv-primary">
                            brondata tonen
                          </summary>
                          <div className="mt-2 rounded-lg border border-zvv-border bg-zvv-card-mid p-2 text-xs">
                            {r.source_goal_events.length === 0 ? (
                              <p className="text-zvv-muted">
                                Geen doelpunt- of assist-gebeurtenissen voor deze speelster in deze wedstrijd.
                              </p>
                            ) : (
                              <ul className="space-y-1">
                                {r.source_goal_events.map((ev) => (
                                  <li key={`${r.match_id}-${ev.sort_order}-${ev.involvement}`}>
                                    Gebeurtenis #{ev.sort_order + 1}: {ev.scorer_name}
                                    {ev.assist_name ? ` (assist: ${ev.assist_name})` : ""}
                                    {ev.involvement === "goal" ? " · telt als goal" : " · telt als assist"}
                                  </li>
                                ))}
                              </ul>
                            )}
                            <p className="mt-2 font-semibold text-zvv-ink">
                              MVP-bron:{" "}
                              {r.is_mvp
                                ? "wedstrijd-MVP = geselecteerde speelster"
                                : "geen MVP op deze speelster"}
                            </p>
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </AdminSection>
      ) : null}
    </div>
  );
}
