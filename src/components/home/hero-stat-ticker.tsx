"use client";

import { useEffect, useState } from "react";

export function HeroStatTicker({ lines }: { lines: string[] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (lines.length <= 1) return;
    const t = setInterval(() => setI((n) => (n + 1) % lines.length), 5200);
    return () => clearInterval(t);
  }, [lines.length]);

  if (!lines.length) return null;
  const line = lines[i] ?? lines[0];

  return (
    <div
      className="relative mt-8 min-h-[2.75rem] overflow-hidden rounded-xl border border-white/25 bg-white/14 px-4 py-3 md:mt-10"
      aria-live="polite"
    >
      <p key={i} className="text-center text-sm font-semibold tracking-wide text-white md:text-[15px]">
        {line}
      </p>
    </div>
  );
}
