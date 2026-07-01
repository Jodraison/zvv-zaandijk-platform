import Link from "next/link";
import { CLUB_NAME, TEAM_DISPLAY_LABEL } from "@/constants/club";
import { ACTIVE_SEASON_PUBLIC_LABEL } from "@/lib/season-foundation/content-2026-27-spec";

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zvv-deep px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-zvv-border bg-white p-8 text-center shadow-[var(--shadow-zvv-card)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zvv-primary">Onderhoud</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl tracking-wide text-zvv-ink">
          {CLUB_NAME}
        </h1>
        <p className="mt-1 text-sm text-zvv-muted">{TEAM_DISPLAY_LABEL}</p>
        <p className="mt-6 text-[15px] leading-relaxed text-zvv-muted">
          De website is tijdelijk niet beschikbaar vanwege onderhoud. We zijn bezig met voorbereidingen voor seizoen{" "}
          {ACTIVE_SEASON_PUBLIC_LABEL}.
        </p>
        <p className="mt-4 text-sm text-zvv-muted">
          Beheerder?{" "}
          <Link href="/login" className="font-semibold text-zvv-primary hover:text-zvv-primary-hover">
            Ga naar inloggen
          </Link>
        </p>
      </div>
    </div>
  );
}
