"use client";

import { useEffect } from "react";
import { GlassCard } from "@/components/layout/glass-card";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const dataUnavailable =
    error.message.includes("Data niet beschikbaar") ||
    error.message.includes("Missing SUPABASE URL") ||
    error.message.includes("Missing SERVICE ROLE KEY") ||
    error.message.includes("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
    error.message.includes("Supabase laden mislukt");

  return (
    <GlassCard className="text-center">
      <h2 className="font-[family-name:var(--font-bebas)] text-3xl text-zvv-ink">
        {dataUnavailable ? "Data niet beschikbaar" : "Er ging iets mis"}
      </h2>
      <p className="mt-2 text-sm text-zvv-muted">
        {dataUnavailable
          ? "Database niet correct geconfigureerd. Controleer .env.local en Supabase setup."
          : "Probeer opnieuw. Blijft het probleem, neem contact op met de beheerder."}
      </p>
      <button type="button" className="club-btn-primary mt-6 px-6 py-2.5 text-sm" onClick={() => reset()}>
        Opnieuw proberen
      </button>
    </GlassCard>
  );
}
