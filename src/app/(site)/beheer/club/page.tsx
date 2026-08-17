import { readDb } from "@/lib/data/repository";
import { requireAdmin } from "@/lib/auth/require-admin";
import { TeamPhotoUploadForm } from "@/components/admin/team-photo-upload-form";
import { GlassCard } from "@/components/layout/glass-card";

export default async function BeheerClubPage() {
  await requireAdmin({ capability: "manage_squad", forbiddenRedirect: "/beheer" });
  const db = await readDb();

  return (
    <div className="space-y-10">
      <header className="border-b border-zvv-border pb-10">
        <p className="club-page-eyebrow">Beheer · Club</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-wide text-zvv-ink md:text-5xl">
          Club
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-zvv-muted">
          Clubbrede instellingen voor de publieke website. De teamfoto geldt voor de homepage en kan per seizoen
          opnieuw worden geüpload.
        </p>
      </header>

      <GlassCard>
        <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">Teamfoto</h2>
        <p className="mt-2 max-w-2xl text-sm text-zvv-muted">
          Seizoen 2025/26 is afgerond. Zonder geüploade foto toont de homepage een nette placeholder: “Nieuwe
          teamfoto volgt binnenkort.” Upload hier de selectiefoto voor 2026/27 wanneer die klaar is.
        </p>
        <div className="mt-6">
          <TeamPhotoUploadForm currentUrl={db.team_photo_url} />
        </div>
      </GlassCard>
    </div>
  );
}
