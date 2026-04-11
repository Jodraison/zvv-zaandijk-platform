import Link from "next/link";
import { readDb } from "@/lib/data/repository";
import { cookies } from "next/headers";
import { resolveSeasonId } from "@/lib/season";
import { buildPlayerDisputeBreakdown } from "@/lib/queries/player-dispute-breakdown";
import { requireAdmin } from "@/lib/auth/require-admin";
import { formatDateNL } from "@/lib/utils/format-date";

type Props = {
  searchParams: Promise<{ player?: string; season?: string }>;
};

export default async function DisputesPage({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;
  const db = await readDb();
  const playerId = (sp.player ?? "").trim();
  const cookieSeason = (await cookies()).get("zvv_season_id")?.value;
  const resolvedSeason = resolveSeasonId(db, cookieSeason);
  const seasonId = (sp.season ?? resolvedSeason).trim();

  const players = [...db.players]
    .sort((a, b) => a.full_name.localeCompare(b.full_name, "nl"));
  const selected = players.find((p) => p.id === playerId) ?? null;

  const breakdown = selected ? buildPlayerDisputeBreakdown(db, selected.id, seasonId) : null;

  return (
    <div className="space-y-6">
      <header className="border-b border-zvv-border pb-6">
        <p className="club-page-eyebrow">Beheer · Disputes</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-wide text-zvv-ink">Player Dispute Tool</h1>
        <p className="mt-2 text-sm text-zvv-muted">Zoek een speler, bekijk alle bronwedstrijden, open direct de match-editor voor correctie en her-verificatie.</p>
      </header>

      <form className="rounded-xl border border-zvv-border bg-white p-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-zvv-muted">Speler</label>
        <div className="mt-2 flex gap-2">
          <input type="hidden" name="season" value={seasonId} />
          <select name="player" defaultValue={playerId} className="min-h-[44px] flex-1 rounded-xl border border-zvv-border bg-white px-3">
            <option value="">Kies speler</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
          <button type="submit" className="club-btn-primary">Zoek</button>
        </div>
      </form>

      {selected ? (
        <div className="space-y-4 rounded-xl border border-zvv-border bg-white p-4">
          <div className="rounded-xl border border-zvv-border bg-zvv-card-mid p-4">
            <p className="text-sm font-semibold text-zvv-ink">{selected.full_name}</p>
            <p className="mt-1 text-xs text-zvv-muted">Dispute breakdown op basis van `match_goal_events` + `matches.wotm_player_id` (season: {seasonId.slice(0, 8)}…)</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-zvv-border bg-white p-3 text-xs"><p className="text-zvv-muted">Goals totaal</p><p className="text-xl font-bold text-zvv-ink">{breakdown?.goals_total ?? 0}</p></div>
              <div className="rounded-lg border border-zvv-border bg-white p-3 text-xs"><p className="text-zvv-muted">Assists totaal</p><p className="text-xl font-bold text-zvv-ink">{breakdown?.assists_total ?? 0}</p></div>
              <div className="rounded-lg border border-zvv-border bg-white p-3 text-xs"><p className="text-zvv-muted">MVP totaal</p><p className="text-xl font-bold text-zvv-ink">{breakdown?.mvp_total ?? 0}</p></div>
              <div className="rounded-lg border border-zvv-border bg-white p-3 text-xs"><p className="text-zvv-muted">Bijdragende matches</p><p className="text-xl font-bold text-zvv-ink">{breakdown?.matches_contributing ?? 0}</p></div>
            </div>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-zvv-card-mid text-xs uppercase tracking-wide text-zvv-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Datum</th>
                  <th className="px-3 py-2 text-left">Wedstrijd</th>
                  <th className="px-3 py-2 text-center">Resultaat</th>
                  <th className="px-3 py-2 text-right">Goals</th>
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
                    <td className="px-3 py-2">{r.is_home ? "Thuis" : "Uit"} · {r.opponent}</td>
                    <td className="px-3 py-2 text-center">{r.result}</td>
                    <td className="px-3 py-2 text-right">{r.goals}</td>
                    <td className="px-3 py-2 text-right">{r.assists}</td>
                    <td className="px-3 py-2 text-right">{r.is_mvp ? "Ja" : "—"}</td>
                    <td className="px-3 py-2 text-right">{r.is_guest_involved ? "Ja" : "—"}</td>
                    <td className="px-3 py-2 text-right">
                      <Link className="club-btn-secondary" href={`/beheer/wedstrijden/${r.match_id}?season=${encodeURIComponent(seasonId)}&returnTo=${encodeURIComponent(`/beheer/disputes?season=${encodeURIComponent(seasonId)}&player=${encodeURIComponent(selected.id)}`)}`}>Bewerk wedstrijd</Link>
                      <details className="mt-2 text-left">
                        <summary className="cursor-pointer text-xs font-semibold text-zvv-muted hover:text-zvv-primary">brondata tonen</summary>
                        <div className="mt-2 rounded-lg border border-zvv-border bg-zvv-card-mid p-2 text-xs">
                          {r.source_goal_events.length === 0 ? (
                            <p className="text-zvv-muted">Geen goal/assist-events voor deze speler in deze wedstrijd.</p>
                          ) : (
                            <ul className="space-y-1">
                              {r.source_goal_events.map((ev) => (
                                <li key={`${r.match_id}-${ev.sort_order}-${ev.involvement}`}>
                                  Event #{ev.sort_order + 1}: {ev.scorer_name}
                                  {ev.assist_name ? ` (assist: ${ev.assist_name})` : ""}
                                  {ev.involvement === "goal" ? " · telt als goal" : " · telt als assist"}
                                </li>
                              ))}
                            </ul>
                          )}
                          <p className="mt-2 font-semibold text-zvv-ink">MVP bron: {r.is_mvp ? "matches.wotm_player_id = geselecteerde speler" : "geen MVP op deze speler"}</p>
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
