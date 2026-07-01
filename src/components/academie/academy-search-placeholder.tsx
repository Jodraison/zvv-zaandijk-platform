import { GlassCard } from "@/components/layout/glass-card";
import { Badge } from "@/components/layout/badge";
import { ACADEMY_SEARCH_PLACEHOLDER_EXAMPLES } from "@/lib/academie";

export function AcademySearchPlaceholder() {
  return (
    <GlassCard glow className="club-card-lift bg-gradient-to-br from-white to-zvv-card-mid/35">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="club-page-eyebrow">Zoeken</p>
        <Badge tone="gold">Binnenkort</Badge>
      </div>
      <label htmlFor="academy-search-placeholder" className="mt-4 block text-sm font-semibold text-zvv-ink">
        Doorzoek de Academy
      </label>
      <div className="relative mt-2">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zvv-muted" aria-hidden>
          🔍
        </span>
        <input
          id="academy-search-placeholder"
          type="search"
          readOnly
          disabled
          aria-disabled="true"
          aria-describedby="academy-search-hint"
          placeholder="Zoeken wordt binnenkort beschikbaar…"
          className="w-full cursor-not-allowed rounded-xl border border-zvv-border bg-zvv-card-mid/80 py-3.5 pl-11 pr-4 text-sm text-zvv-muted opacity-90"
        />
      </div>
      <div id="academy-search-hint" className="mt-5">
        <p className="text-sm font-medium text-zvv-ink">Zoek straks op onderwerpen zoals:</p>
        <ul className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-2" role="list">
          {ACADEMY_SEARCH_PLACEHOLDER_EXAMPLES.map((example) => (
            <li key={example} className="flex items-center gap-2 text-sm text-zvv-muted">
              <span className="text-zvv-primary" aria-hidden>
                •
              </span>
              {example}
            </li>
          ))}
        </ul>
      </div>
    </GlassCard>
  );
}
