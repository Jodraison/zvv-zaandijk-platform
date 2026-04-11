import Link from "next/link";
import { GlassCard } from "@/components/layout/glass-card";
import { readDb } from "@/lib/data/repository";
import { TeamPhotoUploadForm } from "@/components/admin/team-photo-upload-form";

const tiles = [
  { href: "/beheer/wedstrijden", title: "Wedstrijden", desc: "Kalender, uitslagen, selectie, goals en MVP." },
  { href: "/beheer/spelers", title: "Spelers", desc: "Selectie per seizoen, gasten, aanvoerders, foto-URL." },
  { href: "/beheer/training", title: "Training", desc: "Sessies en aanwezigheid met optionele opmerkingen." },
  { href: "/beheer/fitheid", title: "Fitheid", desc: "Sprinttijden met validatie (2 decimalen)." },
  { href: "/beheer/seizoenen", title: "Seizoenen", desc: "Seizoenen aanmaken, actief zetten, spelers koppelen." },
  { href: "/beheer/data-integrity", title: "Data Integrity", desc: "Harde controles op match/training/player consistentie." },
  { href: "/beheer/disputes", title: "Disputes", desc: "Zoek speler, open bronwedstrijden en corrigeer direct." },
  { href: "/beheer/audit-log", title: "Audit Log", desc: "Before/after + verificatie per save, volledig herleidbaar." },
];

export default async function BeheerHomePage() {
  const db = await readDb();

  return (
    <div className="space-y-10">
      <header className="club-section-surface !rounded-2xl !px-6 !py-8 md:!px-8 md:!py-10">
        <p className="club-page-eyebrow">Beheer</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-wide text-zvv-ink md:text-6xl">
          Clubbeheer
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zvv-muted">
          Centrale werkruimte voor het teammanagement. Alle wijzigingen schrijven direct naar Supabase, binnen het seizoen dat bovenin is geselecteerd.
        </p>
      </header>

      <GlassCard>
        <p className="club-page-eyebrow">Homepage</p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">Teamfoto (publiek)</h2>
        <p className="mt-2 max-w-lg text-sm text-zvv-muted">
          Upload naar Supabase Storage (bucket <code className="text-zvv-primary">team</code>). De homepage gebruikt die URL; als die faalt,
          wordt <code className="text-zvv-primary">/team.jpg</code> geprobeerd.
        </p>
        <div className="mt-6">
          <TeamPhotoUploadForm currentUrl={db.team_photo_url} />
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href}>
            <GlassCard className="h-full transition-all duration-300 hover:-translate-y-1 hover:scale-[1.005] hover:border-zvv-primary/25 hover:shadow-[var(--shadow-zvv-lift)]">
              <h2 className="font-[family-name:var(--font-display)] text-xl tracking-wide text-zvv-ink md:text-2xl">{t.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zvv-muted">{t.desc}</p>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
