import Link from "next/link";
import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { GlassCard } from "@/components/layout/glass-card";
import { PlayerCreateForm } from "@/components/admin/player-create-form";
import { PlayerEditCard } from "@/components/admin/player-edit-card";
import { AddPlayerToSeasonForm } from "@/components/admin/add-player-to-season-form";
import { GuestPlayerCreateForm } from "@/components/admin/guest-player-create-form";
import { AdminPageHeader } from "@/components/admin/shell/admin-ui";
import {
  evaluateProfileCompleteness,
  type ProfileCompleteness,
} from "@/lib/players/profile-completeness";
import { membershipPositionLabel } from "@/lib/membership-position-label";
import type { PlayerPosition } from "@/types";
import {
  getUpcomingBirthdays,
  relativeBirthdayAdminBadgeNl,
} from "@/lib/players/birthdays";

export default async function BeheerSpelersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; season?: string; player?: string }>;
}) {
  const db = await readDb();
  const sp = await searchParams;
  const filter = (sp.filter ?? "active") as
    | "all"
    | "active"
    | "guests"
    | "missing"
    | "incomplete"
    | "photo"
    | "birthdate";
  const editPlayerId = (sp.player ?? "").trim();
  const seasonId = await readResolvedSeasonId(db, sp.season);
  const members = db.player_season_memberships.filter((m) => m.season_id === seasonId);
  const memByPlayer = new Map(members.map((m) => [m.player_id, m]));
  const candidates = db.players
    .filter((p) => !p.is_guest)
    .filter((p) => !members.some((m) => m.player_id === p.id))
    .map((p) => ({ id: p.id, name: p.full_name }))
    .sort((a, b) => a.name.localeCompare(b.name, "nl"));

  const list = db.players
    .map((p) => {
      const mem = memByPlayer.get(p.id) ?? null;
      const completeness: ProfileCompleteness = evaluateProfileCompleteness(p, mem);
      return { p, mem, completeness };
    })
    .filter((row) => {
      if (filter === "all") return true;
      if (filter === "active") return !!row.mem && !row.p.is_guest;
      if (filter === "guests") return row.p.is_guest;
      if (filter === "missing") return !row.mem && !row.p.is_guest;
      if (filter === "incomplete") return row.completeness.requiredMissing.length > 0;
      if (filter === "photo")
        return row.completeness.recommendedMissing.some((i) => i.code === "photo");
      if (filter === "birthdate")
        return (
          !!row.mem &&
          !row.p.is_guest &&
          row.completeness.recommendedMissing.some((i) => i.code === "birth_date")
        );
      return true;
    })
    .sort((a, b) => {
      const sa = a.mem?.shirt_number ?? 999;
      const sb = b.mem?.shirt_number ?? 999;
      if (sa !== sb) return sa - sb;
      return a.p.full_name.localeCompare(b.p.full_name, "nl");
    });

  const seasonQ = seasonId ? `&season=${encodeURIComponent(seasonId)}` : "";
  const listHref = `/beheer/spelers?filter=${encodeURIComponent(filter)}${seasonQ}`;
  const editRow = editPlayerId ? list.find(({ p }) => p.id === editPlayerId) : null;
  const upcomingByPlayer = new Map(
    getUpcomingBirthdays(
      members
        .map((m) => {
          const p = db.players.find((x) => x.id === m.player_id);
          if (!p || p.is_guest || m.is_guest) return null;
          return { id: p.id, full_name: p.full_name, birth_date: p.birth_date ?? null };
        })
        .filter((x): x is NonNullable<typeof x> => !!x),
      new Date(),
      14,
      50,
    ).map((r) => [r.id, r.daysUntil]),
  );

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Beheer · Spelers"
        title="Speelsters"
        description="Selectie van het actieve seizoen. Rugnummers zijn uniek per seizoen. Aanvoerder en vice-aanvoerder zijn exclusief."
        actions={
          <a
            href="#speler-toevoegen"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-zvv-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95"
          >
            Speelster toevoegen
          </a>
        }
      />

      <section className="space-y-4">
        {editPlayerId ? (
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={listHref}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-zvv-border bg-white px-3 py-2 text-sm font-semibold text-zvv-ink hover:border-zvv-primary/30"
            >
              ← Terug naar overzicht
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-[family-name:var(--font-display)] text-xl tracking-wide text-zvv-ink sm:text-2xl">Overzicht</h2>
            <div className="flex flex-wrap gap-2 text-sm" role="tablist" aria-label="Speelsterfilters">
              {[
                ["active", "Selectie"],
                ["guests", "Gasten"],
                ["missing", "Niet in seizoen"],
                ["photo", "Foto ontbreekt"],
                ["birthdate", "Geboortedatum ontbreekt"],
                ["incomplete", "Verplicht ontbreekt"],
                ["all", "Alles"],
              ].map(([id, label]) => (
                <Link
                  key={id}
                  href={`/beheer/spelers?filter=${id}${seasonQ}`}
                  className={`rounded-lg border px-3 py-2 ${filter === id ? "border-zvv-primary bg-zvv-primary-muted text-zvv-primary" : "border-zvv-border bg-white text-zvv-muted"}`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {editPlayerId && editRow?.mem ? (
          <PlayerEditCard
            key={editRow.mem.id + editRow.p.id}
            seasonId={seasonId}
            playerId={editRow.p.id}
            fullName={editRow.p.full_name}
            photoUrl={editRow.p.photo_url}
            shirtNumber={editRow.mem.shirt_number}
            position={editRow.mem.position}
            displayPosition={editRow.mem.display_position}
            isCaptain={editRow.mem.is_captain}
            isViceCaptain={editRow.mem.is_vice_captain}
            initials={editRow.p.initials}
            preferredFoot={editRow.p.preferred_foot}
            roleLabel={editRow.p.role_label}
            tagline={editRow.p.tagline}
            strengths={editRow.p.strengths}
            bio={editRow.p.bio}
            cardNote={editRow.p.card_note}
            birthDate={editRow.p.birth_date ?? null}
            isGuest={editRow.p.is_guest || editRow.mem.is_guest}
          />
        ) : editPlayerId ? (
          <GlassCard className="club-empty-state !text-left">
            <p className="text-sm text-zvv-muted">Speelster niet gevonden in deze weergave.</p>
            <Link href={listHref} className="mt-3 inline-flex text-sm font-semibold text-zvv-primary hover:underline">
              Terug naar overzicht
            </Link>
          </GlassCard>
        ) : list.length === 0 ? (
          <GlassCard className="club-empty-state !text-left">
            <p className="text-sm text-zvv-muted">Geen speelsters in deze weergave.</p>
          </GlassCard>
        ) : (
          <ul className="divide-y divide-zvv-border overflow-hidden rounded-2xl border border-zvv-border bg-white shadow-sm">
            {list.map(({ p: pl, mem, completeness }) => {
              const playerHref = `/beheer/spelers?filter=${encodeURIComponent(filter)}&player=${encodeURIComponent(pl.id)}${seasonQ}`;
              if (!mem) {
                return (
                  <li key={pl.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-zvv-ink">{pl.full_name}</p>
                      <p className="mt-0.5 text-sm text-zvv-muted">
                        {pl.is_guest ? "Gastspeelster" : "Nog niet gekoppeld aan dit seizoen"}
                      </p>
                    </div>
                  </li>
                );
              }
              const positionLabel = membershipPositionLabel(
                mem.display_position,
                mem.position as PlayerPosition,
              );
              const issueLabels = [
                ...completeness.requiredMissing.map((i) => i.label),
                ...completeness.recommendedMissing.map((i) => i.label),
              ];
              const daysUntil = upcomingByPlayer.get(pl.id);
              const birthdayBadge =
                daysUntil == null ? null : relativeBirthdayAdminBadgeNl(daysUntil);
              return (
                <li key={mem.id + pl.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 sm:gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zvv-card-mid font-[family-name:var(--font-display)] text-lg text-zvv-ink">
                    {mem.shirt_number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-zvv-ink">{pl.full_name}</p>
                    <p className="truncate text-sm text-zvv-muted">{positionLabel}</p>
                    {issueLabels.length > 0 ? (
                      <p className="mt-0.5 text-xs text-zvv-muted">{issueLabels.join(" · ")}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {birthdayBadge ? (
                      <span className="rounded-full border border-amber-300/50 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-950">
                        {birthdayBadge}
                      </span>
                    ) : null}
                    {mem.is_captain ? (
                      <span className="rounded-full border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-900">
                        C
                      </span>
                    ) : null}
                    {mem.is_vice_captain ? (
                      <span className="rounded-full border border-zvv-border bg-zvv-card-mid px-2 py-0.5 text-[10px] font-bold tracking-wide text-zvv-muted">
                        VC
                      </span>
                    ) : null}
                    {pl.is_guest || mem.is_guest ? (
                      <span className="rounded-full border border-zvv-primary/30 bg-zvv-primary-muted px-2 py-0.5 text-[10px] font-bold tracking-wide text-zvv-primary">
                        Gast
                      </span>
                    ) : null}
                    {completeness.requiredMissing.length > 0 ? (
                      <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-900">
                        {completeness.summaryLabel}
                      </span>
                    ) : completeness.recommendedMissing.length > 0 ? (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        {completeness.summaryLabel}
                      </span>
                    ) : null}
                  </div>
                  <Link
                    href={playerHref}
                    className="club-btn-secondary club-btn-primary-sm shrink-0"
                  >
                    {completeness.recommendedMissing.some((i) => i.code === "photo")
                      ? "Foto toevoegen"
                      : "Bewerken"}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <details id="speler-toevoegen" className="rounded-2xl border border-zvv-border bg-white p-4 open:pb-6">
        <summary className="cursor-pointer font-[family-name:var(--font-display)] text-xl text-zvv-ink">
          Speelster toevoegen of koppelen
        </summary>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <GlassCard>
            <h3 className="font-[family-name:var(--font-display)] text-xl text-zvv-ink">Nieuwe speelster</h3>
            <p className="mt-2 text-sm text-zvv-muted">Clubrecord + directe seizoenskoppeling.</p>
            <div className="mt-6">
              <PlayerCreateForm seasonId={seasonId} />
            </div>
          </GlassCard>
          <GlassCard>
            <h3 className="font-[family-name:var(--font-display)] text-xl text-zvv-ink">Nieuwe gast</h3>
            <p className="mt-2 text-sm text-zvv-muted">Optioneel direct aan dit seizoen koppelen.</p>
            <div className="mt-6">
              <GuestPlayerCreateForm seasonId={seasonId} />
            </div>
          </GlassCard>
        </div>
        <GlassCard className="mt-6">
          <h3 className="font-[family-name:var(--font-display)] text-xl text-zvv-ink">Bestaande speelster aan seizoen</h3>
          <div className="mt-6">
            <AddPlayerToSeasonForm seasonId={seasonId} candidates={candidates} />
          </div>
        </GlassCard>
      </details>
    </div>
  );
}
