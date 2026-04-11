"use client";

import { useEffect } from "react";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
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
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-zvv-ink md:text-4xl">
        {dataUnavailable ? "Data niet beschikbaar" : "Er ging iets mis"}
      </h1>
      <p className="mt-3 max-w-md text-sm text-zvv-muted">
        {dataUnavailable
          ? "Database niet correct geconfigureerd. Controleer .env.local en Supabase setup."
          : error.message}
      </p>
      <button type="button" className="club-btn-primary mt-8 px-6 py-2.5 text-sm" onClick={() => reset()}>
        Opnieuw proberen
      </button>
    </div>
  );
}
