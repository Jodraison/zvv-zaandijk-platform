import { cookies } from "next/headers";
import Link from "next/link";
import { readDb } from "@/lib/data/repository";
import { resolveSeasonId } from "@/lib/season";
import { GlassCard } from "@/components/layout/glass-card";
import { PlayerCreateForm } from "@/components/admin/player-create-form";
import { PlayerEditCard } from "@/components/admin/player-edit-card";
import { AddPlayerToSeasonForm } from "@/components/admin/add-player-to-season-form";
import { GuestPlayerCreateForm } from "@/components/admin/guest-player-create-form";

export default async function BeheerSpelersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const db = await readDb();
  const sp = await searchParams;
  const filter = (sp.filter ?? "active") as "all" | "active" | "guests" | "missing" | "incomplete";
  const cookieSeason = (await cookies()).get("zvv_season_id")?.value;
  const seasonId = resolveSeasonId(db, cookieSeason);
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
      const incompleteProfile = !p.photo_url || !p.role_label || !p.tagline;
      return { p, mem, incompleteProfile };
    })
    .filter((row) => {
      if (filter === "all") return true;
      if (filter === "active") return !!row.mem && !row.p.is_guest;
      if (filter === "guests") return row.p.is_guest;
      if (filter === "missing") return !row.mem && !row.p.is_guest;
      if (filter === "incomplete") return row.incompleteProfile;
      return true;
    })
    .sort((a, b) => {
      const sa = a.mem?.shirt_number ?? 999;
      const sb = b.mem?.shirt_number ?? 999;
      if (sa !== sb) return sa - sb;
      return a.p.full_name.localeCompare(b.p.full_name, "nl");
    });

  return (
    <div className="space-y-10">
      <header className="border-b border-zvv-border pb-10">
        <p className="club-page-eyebrow">Beheer · Spelers</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-wide text-zvv-ink md:text-5xl">Selectie</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zvv-muted">
          Nieuw lidmaatschap voor het <strong className="text-zvv-ink/90">geselecteerde seizoen</strong> (header). Rugnummers zijn uniek per seizoen. Aanvoerder en assistent zijn exclusief per seizoen.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">Nieuwe speelster</h2>
          <p className="mt-2 text-sm text-zvv-muted">Clubrecord + directe seizoenskoppeling (shirt/positie/captain).</p>
          <div className="mt-6">
            <PlayerCreateForm seasonId={seasonId} />
          </div>
        </GlassCard>
        <GlassCard>
          <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">Nieuwe gast-speelster</h2>
          <p className="mt-2 text-sm text-zvv-muted">Volwaardige guest-flow, optioneel direct aan dit seizoen koppelen.</p>
          <div className="mt-6">
            <GuestPlayerCreateForm seasonId={seasonId} />
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">Koppel bestaande speelster aan seizoen</h2>
        <p className="mt-2 text-sm text-zvv-muted">Gebruik dit om missende spelers (zoals Pitou) direct seizoensactief te maken.</p>
        <div className="mt-6">
          <AddPlayerToSeasonForm seasonId={seasonId} candidates={candidates} />
        </div>
      </GlassCard>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">Squad Control Center</h2>
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              ["active", "Active squad"],
              ["guests", "Guests"],
              ["missing", "Missing membership"],
              ["incomplete", "Incomplete profiles"],
              ["all", "All"],
            ].map(([id, label]) => (
              <Link key={id} href={`/beheer/spelers?filter=${id}`} className={`rounded-lg border px-3 py-1.5 ${filter === id ? "border-zvv-primary bg-zvv-primary-muted text-zvv-primary" : "border-zvv-border bg-white text-zvv-muted"}`}>
                {label}
              </Link>
            ))}
          </div>
        </div>
        {list.length === 0 ? (
          <GlassCard className="club-empty-state !text-left">
            <p className="font-medium text-zvv-ink">Nog geen speelsters</p>
            <p className="mt-2">Geen records voor dit filter.</p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {list.map(({ p: pl, mem }) => {
              if (!mem) {
                return (
                  <GlassCard key={pl.id}>
                    <p className="font-semibold text-zvv-ink">{pl.full_name}</p>
                    <p className="mt-1 text-sm text-zvv-muted">Geen membership voor geselecteerd seizoen.</p>
                  </GlassCard>
                );
              }
              return (
                <PlayerEditCard
                  key={mem.id + pl.id}
                  seasonId={seasonId}
                  playerId={pl.id}
                  fullName={pl.full_name}
                  photoUrl={pl.photo_url}
                  shirtNumber={mem.shirt_number}
                  position={mem.position}
                  displayPosition={mem.display_position}
                  isCaptain={mem.is_captain}
                  isViceCaptain={mem.is_vice_captain}
                  initials={pl.initials}
                  preferredFoot={pl.preferred_foot}
                  roleLabel={pl.role_label}
                  tagline={pl.tagline}
                  strengths={pl.strengths}
                  bio={pl.bio}
                  cardNote={pl.card_note}
                  isGuest={pl.is_guest || mem.is_guest}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
