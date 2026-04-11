"use client";

function IconGoal({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" className="opacity-90" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconAssist({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12h12l-3-3M14 9l3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 7v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
    </svg>
  );
}

function IconStar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6L12 2z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
        className="opacity-95"
      />
    </svg>
  );
}

export function PlayerProfilePowerStats({
  goals,
  assists,
  wotm,
}: {
  goals: number;
  assists: number;
  wotm: number;
}) {
  const items = [
    {
      label: "Goals",
      value: goals,
      icon: IconGoal,
      glow: "from-sky-400/20 to-transparent",
    },
    {
      label: "Assists",
      value: assists,
      icon: IconAssist,
      glow: "from-cyan-400/15 to-transparent",
    },
    {
      label: "WOTM",
      value: wotm,
      icon: IconStar,
      glow: "from-amber-400/20 to-transparent",
    },
  ] as const;

  return (
    <section className="mt-10" aria-label="Seizoen statistieken">
      <p className="text-center text-xs font-bold uppercase tracking-[0.28em] text-white/45 md:text-left">
        Seizoen · cijfers
      </p>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-center shadow-[0_0_24px_rgba(29,95,209,0.06)] transition-[transform,box-shadow] duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.01] sm:px-6 sm:py-6`}
            >
              <div
                className={`pointer-events-none absolute -top-6 left-1/2 h-20 w-36 -translate-x-1/2 rounded-full bg-gradient-to-b ${item.glow} opacity-0 blur-xl transition-opacity duration-200 group-hover:opacity-80`}
                aria-hidden
              />
              <div className="relative flex flex-col items-center">
                <Icon className="mx-auto mb-3 h-8 w-8 text-sky-200/90" />
                <p className="font-[family-name:var(--font-display)] text-5xl font-black leading-none tracking-tight text-white tabular-nums sm:text-6xl">
                  {item.value}
                </p>
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-white/60">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
