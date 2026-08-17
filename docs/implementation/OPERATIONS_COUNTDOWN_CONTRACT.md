# Operations Countdown Contract

## Centrale engine

Module: `src/lib/operations/countdown.ts`

```ts
type CountdownState = "future" | "tomorrow" | "today" | "soon" | "live" | "past" | "missing";

type CountdownResult = {
  state: CountdownState;
  primaryLabel: string;
  secondaryLabel?: string;
  urgency: "neutral" | "upcoming" | "today" | "overdue";
  targetIso: string | null;
};
```

UI: `OperationsCountdownLabel` (client, hydration-safe, adaptief refreshinterval).

Tijdzone: club-lokaal via `Europe/Amsterdam` labels; date-only als lokale midday om UTC-day-shift te vermijden.

## Kaarten

| Countdown | Bron | Selectieregel | Weergave | Primaire actie |
|-----------|------|---------------|----------|----------------|
| Wedstrijd | `nextScheduledMatch` / `resolveNextMatch` | Eerstvolgende toekomstige, actief seizoen, niet geannuleerd | Tegenstander, thuis/uit, kickoff, countdown | Openen / opstelling / uitslag / plannen |
| Training | `nextTrainingSession` | Achterstallige incomplete aanwezigheid eerst; anders eerstvolgende toekomstige sessie; anders suggestie ma/wo 19:30 | Datum/tijd, aanwezigheidsstatus | Nu invullen / registreren / openen |
| Fitheid | `nextFitnessMoment` | Open draft → toekomstige/geplande → expected (laatste + 6w) → overdue → none | Gepland of Verwacht + vorige test | Hervatten / voorbereiden / nieuw plannen |

## Menselijke labels (NL)

Voorbeelden: over 6 weken; over 5 weken en 2 dagen; over 3 dagen; morgen om 19:30; vandaag om 19:30; begint over 45 minuten; nu bezig; 2 uur geleden.

## Refreshbeleid

| Afstand | Interval |
|---------|----------|
| ≤ 1 uur | per minuut |
| ≤ 1 dag | per 5 minuten |
| verder | page load voldoende |

## Eventselectie

Implementatie: `src/lib/operations/next-events.ts`.

## Tests

- `src/lib/operations/countdown.test.ts`
- `src/lib/operations/countdown-scenarios.test.ts`
- `npm run test:countdown`
