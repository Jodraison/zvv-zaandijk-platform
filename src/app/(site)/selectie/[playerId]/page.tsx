import { notFound } from "next/navigation";
import Link from "next/link";
import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { buildPlayerDetail } from "@/lib/queries/player-detail";
import { PlayerProfileHero } from "@/components/players/player-profile-hero";
import { formatKickoffLongNl, formatHumanDateNL } from "@/lib/utils/format-date";
import { membershipPositionLabel } from "@/lib/membership-position-label";
import { formationSlotLabel, isFormationSlotCode } from "@/lib/match/formation-4231";
import { isProductionMatch } from "@/lib/match/match-data-scope";
import { shouldShowPlayerCleanSheetsStat } from "@/lib/statistics/clean-sheets";

type Props = {
  params: Promise<{ playerId: string }>;
  searchParams: Promise<{ season?: string }>;
};

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-zvv-border bg-white px-4 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zvv-muted">{label}</p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-3xl tabular-nums text-zvv-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-zvv-muted">{hint}</p> : null}
    </div>
  );
}

export default async function PlayerDetailPage({ params, searchParams }: Props) {
  const { playerId } = await params;
  const sp = await searchParams;
  const db = await readDb();
  const seasonId = await readResolvedSeasonId(db, sp.season);
  const player = db.players.find((p) => p.id === playerId);
  if (!player || player.is_guest) notFound();
  const mem = db.player_season_memberships.find((m) => m.player_id === playerId && m.season_id === seasonId);
  if (!mem) notFound();
  const detail = buildPlayerDetail(db, playerId, seasonId);
  if (!detail) notFound();

  const season = db.seasons.find((s) => s.id === seasonId);
  const q = `?season=${encodeURIComponent(seasonId)}`;

  const played = db.matches.filter(
    (m) =>
      m.season_id === seasonId &&
      m.status === "played" &&
      (m.integrity_state ?? "verified") === "verified" &&
      isProductionMatch(m),
  );
  const starts = played.filter((m) =>
    db.match_lineup_entries.some((e) => e.match_id === m.id && e.player_id === playerId && e.role === "starter"),
  ).length;
  const benches = played.filter((m) =>
    db.match_lineup_entries.some((e) => e.match_id === m.id && e.player_id === playerId && e.role === "bench"),
  ).length;

  const positionHistory = played
    .slice()
    .sort((a, b) => b.kickoff_at.localeCompare(a.kickoff_at))
    .map((m) => {
      const entry = db.match_lineup_entries.find((e) => e.match_id === m.id && e.player_id === playerId);
      if (!entry || (entry.role !== "starter" && entry.role !== "bench")) return null;
      const slot = entry.position?.trim() || null;
      const subIn = db.match_substitutions.find((s) => s.match_id === m.id && s.player_in_id === playerId);
      return {
        match_id: m.id,
        opponent: m.opponent,
        kickoff_at: m.kickoff_at,
        role: entry.role as "starter" | "bench",
        slotLabel: slot && isFormationSlotCode(slot) ? slot : slot,
        minuteIn: subIn?.minute ?? null,
      };
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
    .slice(0, 8);

  const slotCounts = new Map<string, number>();
  for (const h of positionHistory) {
    if (h.role === "starter" && h.slotLabel) {
      slotCounts.set(h.slotLabel, (slotCounts.get(h.slotLabel) ?? 0) + 1);
    }
  }
  const mostPlayedSlot =
    [...slotCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null;

  return (
    <div className="space-y-8 md:space-y-10">
      <Link
        href={`/selectie${q}`}
        prefetch
        className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-zvv-border bg-white px-5 py-2.5 text-sm font-bold text-zvv-ink shadow-sm hover:border-zvv-primary/30"
      >
        <span aria-hidden>←</span> Terug naar selectie
      </Link>

      <PlayerProfileHero
        fullName={player.full_name}
        photoUrl={player.photo_url}
        shirtNumber={mem.shirt_number}
        positionLabel={membershipPositionLabel(mem.display_position, mem.position)}
        seasonName={season?.name ?? "Seizoen"}
        isCaptain={mem.is_captain}
        isViceCaptain={mem.is_vice_captain}
        isGuest={mem.is_guest}
        roleLabel={player.role_label}
        tagline={player.tagline}
      />

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-zvv-ink md:text-3xl">Prestaties</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-4">
          <StatCard label="Wedstrijden" value={played.length ? starts + benches : 0} hint={played.length ? undefined : "Nog geen gespeelde wedstrijden"} />
          <StatCard label="Basisplaatsen" value={starts} />
          <StatCard label="Invalbeurten" value={benches} />
          <StatCard label="Doelpunten" value={detail.goals_total} />
          <StatCard label="Assists" value={detail.assists_total} />
          <StatCard label="MVP" value={detail.wotm_total} />
          {shouldShowPlayerCleanSheetsStat(mem.position, mem.display_position, detail.clean_sheets_total) ? (
            <StatCard
              label="Wedstrijden zonder tegengoals"
              value={detail.clean_sheets_total}
              hint="Keepers en verdedigers die meespeelden zonder tegendoelpunt"
            />
          ) : null}
          <StatCard
            label="Aanwezigheid"
            value={detail.sessions_considered > 0 ? `${detail.attendance_rate}%` : "—"}
            hint={
              detail.sessions_considered > 0
                ? `${detail.sessions_considered} geregistreerde training(en)`
                : "Nog geen geregistreerde training"
            }
          />
          <StatCard
            label="Wedstrijdpositie"
            value={mostPlayedSlot ?? "—"}
            hint={mostPlayedSlot ? formationSlotLabel(mostPlayedSlot) : "Na de eerste wedstrijd"}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-zvv-border bg-white p-5 shadow-sm md:p-7">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-zvv-ink">Rol in het team</h2>
        {player.bio ? (
          <p className="mt-4 text-base leading-relaxed text-zvv-ink md:text-lg">{player.bio}</p>
        ) : (
          <p className="mt-4 text-base text-zvv-muted">Nog geen verhaal toegevoegd voor deze speelster.</p>
        )}
        {(player.preferred_foot || player.strengths) && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {player.preferred_foot ? (
              <div className="rounded-xl bg-zvv-card-mid/50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-zvv-muted">Voorkeursvoet</p>
                <p className="mt-1 font-semibold text-zvv-ink">{player.preferred_foot}</p>
              </div>
            ) : null}
            {player.strengths ? (
              <div className="rounded-xl bg-zvv-card-mid/50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-zvv-muted">Sterktes</p>
                <p className="mt-1 font-semibold text-zvv-ink">{player.strengths}</p>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-zvv-border bg-gradient-to-b from-white to-zvv-card-mid/40 p-5 md:p-7">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-zvv-ink">Ontwikkeling</h2>
        {positionHistory.length === 0 && detail.sessions_considered === 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-zvv-muted md:text-base">
            De eerste gegevens verschijnen zodra het seizoen is gestart.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {positionHistory.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-zvv-primary">Recente wedstrijden</h3>
                <ul className="mt-2 space-y-2">
                  {positionHistory.map((h) => (
                    <li key={h.match_id} className="text-sm text-zvv-ink">
                      <Link href={`/wedstrijden/${h.match_id}${q}`} className="font-medium hover:underline">
                        {formatHumanDateNL(h.kickoff_at)} — vs {h.opponent}
                      </Link>
                      {" · "}
                      {h.slotLabel ?? "—"}
                      {" · "}
                      {h.role === "starter"
                        ? "gestart"
                        : h.minuteIn != null
                          ? `ingevallen in ${h.minuteIn}'`
                          : "bank"}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-zvv-muted">Wedstrijdposities verschijnen na de eerste gespeelde wedstrijd.</p>
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-zvv-border bg-white p-5 md:p-7">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-zvv-ink">Recente wedstrijden</h2>
        {detail.recent_matches.length === 0 ? (
          <p className="mt-3 text-sm text-zvv-muted">Nog geen gespeelde wedstrijden dit seizoen.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {detail.recent_matches.map((m) => (
              <li key={m.match_id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zvv-border px-4 py-3">
                <div>
                  <p className="font-semibold text-zvv-ink">vs {m.opponent}</p>
                  <p className="text-xs text-zvv-muted">{formatKickoffLongNl(m.kickoff_at)}</p>
                </div>
                <div className="text-sm text-zvv-muted">
                  {m.goals}G · {m.assists}A{m.is_wotm ? " · MVP" : ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
