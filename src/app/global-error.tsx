"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="nl">
      <body className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center font-sans antialiased">
        <h1 className="text-2xl font-semibold text-slate-900">Er ging iets mis</h1>
        <p className="mt-3 max-w-md text-sm text-slate-600">De pagina kon niet worden geladen. Probeer het opnieuw.</p>
        <button
          type="button"
          className="mt-8 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white"
          onClick={() => reset()}
        >
          Opnieuw proberen
        </button>
      </body>
    </html>
  );
}
