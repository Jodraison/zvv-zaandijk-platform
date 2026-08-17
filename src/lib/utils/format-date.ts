/** Kalenderdatum-only (YYYY-MM-DD) stabiel parsen i.p.v. UTC-midnight shifts. */
function parseClubDateInput(input: string | Date | number): Date {
  if (input instanceof Date) return input;
  if (typeof input === "number") return new Date(input);
  const s = input.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(`${s}T12:00:00.000Z`);
  }
  return new Date(s);
}

function safe(d: Date, fmt: () => string): string {
  return Number.isNaN(d.getTime()) ? "—" : fmt();
}

/** DD-MM-YYYY (nl-NL). Gebruik voor grafieken, tabellen, sessiedata. */
export function formatDateNL(date: string | Date | number): string {
  const d = parseClubDateInput(date);
  return safe(d, () =>
    d.toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
  );
}

/** Menselijke datum: "maandag 17 augustus" (jaar alleen als ≠ huidig). */
export function formatHumanDateNL(date: string | Date | number, opts?: { includeYear?: boolean }): string {
  const d = parseClubDateInput(date);
  return safe(d, () => {
    const nowY = new Date().getFullYear();
    const includeYear = opts?.includeYear ?? d.getUTCFullYear() !== nowY;
    return d.toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      ...(includeYear ? { year: "numeric" as const } : {}),
      timeZone: "Europe/Amsterdam",
    });
  });
}

const AMSTERDAM = { timeZone: "Europe/Amsterdam" } as const;

/** Kloktijd in Europe/Amsterdam (HH:MM). */
export function formatTimeNl(date: string | Date | number): string {
  const d = parseClubDateInput(date);
  return safe(d, () =>
    d.toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
      ...AMSTERDAM,
    }),
  );
}

/** DD-MM-YYYY + tijd (uur:minuut), nl-NL, altijd Amsterdam. */
export function formatDateTimeNL(date: string | Date | number): string {
  const d = parseClubDateInput(date);
  return safe(d, () => {
    const day = d.toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      ...AMSTERDAM,
    });
    return `${day} ${formatTimeNl(d)}`;
  });
}

/** Lange weekdag + DD-MM-YYYY + tijd (wedstrijdmomenten). */
export function formatKickoffLongNl(iso: string): string {
  const d = parseClubDateInput(iso);
  return safe(d, () => {
    const wd = d.toLocaleDateString("nl-NL", { weekday: "long", ...AMSTERDAM });
    return `${wd} ${formatDateTimeNL(d)}`;
  });
}

/** Korte weekdag + DD-MM-YYYY + tijd (home teaser). */
export function formatKickoffShortNl(iso: string): string {
  const d = parseClubDateInput(iso);
  return safe(d, () => {
    const wd = d.toLocaleDateString("nl-NL", { weekday: "short", ...AMSTERDAM });
    return `${wd} ${formatDateTimeNL(d)}`;
  });
}
