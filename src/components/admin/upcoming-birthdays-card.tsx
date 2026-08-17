import Link from "next/link";
import {
  buildBirthdayAdminPreviewHref,
  formatBirthdayDateNL,
  relativeBirthdayLabelNl,
  type BirthdayOccurrence,
} from "@/lib/players/birthdays";
import { withSeason } from "@/lib/admin/beheer-nav";

type DayGroup = {
  nextOccurrence: string;
  daysUntil: number;
  players: BirthdayOccurrence[];
};

function groupByDay(upcoming: BirthdayOccurrence[]): DayGroup[] {
  const map = new Map<string, DayGroup>();
  for (const row of upcoming) {
    const existing = map.get(row.nextOccurrence);
    if (existing) {
      existing.players.push(row);
    } else {
      map.set(row.nextOccurrence, {
        nextOccurrence: row.nextOccurrence,
        daysUntil: row.daysUntil,
        players: [row],
      });
    }
  }
  return [...map.values()].sort((a, b) => a.daysUntil - b.daysUntil);
}

export function UpcomingBirthdaysCard({
  seasonId,
  upcoming,
  missingCount,
}: {
  seasonId: string;
  upcoming: BirthdayOccurrence[];
  missingCount: number;
}) {
  const groups = groupByDay(upcoming);

  return (
    <section
      className="rounded-2xl border border-zvv-border bg-white p-5 shadow-sm md:p-6"
      aria-labelledby="upcoming-birthdays-heading"
      data-testid="upcoming-birthdays"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="upcoming-birthdays-heading"
            className="font-[family-name:var(--font-display)] text-xl tracking-wide text-zvv-ink"
          >
            Komende verjaardagen
          </h2>
          <p className="mt-1 text-sm text-zvv-muted">Eerstvolgende momenten in de selectie (zonder geboortejaar).</p>
        </div>
        <Link
          href={withSeason("/beheer/spelers", seasonId)}
          className="inline-flex min-h-10 items-center text-sm font-semibold text-zvv-primary hover:underline"
        >
          Alle speelsters bekijken
        </Link>
      </div>

      {groups.length === 0 ? (
        <p className="mt-4 rounded-xl border border-zvv-border bg-zvv-card-mid/60 px-4 py-3 text-sm text-zvv-muted">
          Geen verjaardagen in de komende 60 dagen.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-zvv-border rounded-xl border border-zvv-border">
          {groups.map((group) => {
            const previewHref = buildBirthdayAdminPreviewHref({
              seasonId,
              datum: group.nextOccurrence,
            });
            const names = group.players.map((p) => p.full_name);
            const nameLine =
              names.length === 1
                ? names[0]!
                : names.length === 2
                  ? `${names[0]} en ${names[1]}`
                  : `${names.slice(0, -1).join(", ")} en ${names[names.length - 1]}`;
            const dateLabel = group.players[0]?.birth_date
              ? formatBirthdayDateNL(group.players[0].birth_date)
              : "—";

            return (
              <li
                key={group.nextOccurrence}
                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                data-testid={group.daysUntil <= 1 ? "upcoming-birthday-next" : undefined}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zvv-primary">
                    {relativeBirthdayLabelNl(group.daysUntil)}
                  </p>
                  <p className="mt-0.5 font-semibold text-zvv-ink">{nameLine}</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  <p className="text-sm text-zvv-muted">{dateLabel}</p>
                  <a
                    href={previewHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-zvv-primary/30 bg-zvv-primary-muted px-3 py-2 text-sm font-semibold text-zvv-primary hover:bg-zvv-primary/15"
                    data-testid="birthday-preview-link"
                    data-preview-datum={group.nextOccurrence}
                    data-preview-season={seasonId}
                  >
                    Bekijk verjaardagsspotlight
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {missingCount > 0 ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
          <p className="text-sm text-amber-950">
            Bij {missingCount} speelster{missingCount === 1 ? "" : "s"} ontbreekt de geboortedatum.
          </p>
          <Link
            href={withSeason("/beheer/spelers?filter=birthdate", seasonId)}
            className="inline-flex min-h-10 items-center text-sm font-semibold text-amber-950 underline-offset-4 hover:underline"
          >
            Geboortedatums aanvullen
          </Link>
        </div>
      ) : null}
    </section>
  );
}
