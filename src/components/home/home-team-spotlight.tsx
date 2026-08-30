import { TEAM_DISPLAY_LABEL_UPPER } from "@/constants/club";
import type { HomeTeamSpotlightModel } from "@/lib/home/team-spotlight";
import { cn } from "@/lib/utils";

export function HomeTeamSpotlight({
  model,
  className,
}: {
  model: HomeTeamSpotlightModel;
  className?: string;
}) {
  const rows = [model.training, model.fitness, model.birthday].filter(Boolean) as NonNullable<
    HomeTeamSpotlightModel["training"]
  >[];

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-[1.75rem] text-white",
        "border border-blue-200/22",
        "bg-gradient-to-br from-white/12 via-white/6 to-[#020817]/40",
        "shadow-[0_28px_70px_rgba(2,6,23,0.45),0_0_0_1px_rgba(147,197,253,0.08)]",
        "backdrop-blur-md",
        "min-h-[300px] p-6 sm:min-h-[340px] sm:p-7 xl:min-h-[400px] xl:w-[min(46vw,620px)] xl:p-8",
        className,
      )}
      aria-labelledby="home-team-spotlight-heading"
      data-testid="home-team-spotlight"
      data-spotlight-mode={model.mode}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -right-16 top-0 h-56 w-56 rounded-full bg-sky-300/16 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-blue-700/25 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      </div>

      <div className="relative z-10 flex h-full min-h-[inherit] flex-col">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-blue-100/80">{model.eyebrow}</p>
        <h2
          id="home-team-spotlight-heading"
          className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2.1rem,4vw,3.1rem)] leading-[0.9] tracking-wide"
        >
          {model.title || TEAM_DISPLAY_LABEL_UPPER}
        </h2>

        {rows.length > 0 ? (
          <div className="mt-8 space-y-5">
            {rows.map((row) => (
              <div
                key={row.title}
                className="border-t border-white/12 pt-5 first:border-t-0 first:pt-0"
                data-testid={row.title === "Eerstvolgende verjaardag" ? "home-next-birthday" : undefined}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-100/62">{row.title}</p>
                <p className="mt-2 text-[17px] font-semibold leading-snug text-white sm:text-lg">{row.detail}</p>
                {row.subdetail ? (
                  <p className="mt-1 text-[17px] font-semibold leading-snug text-white sm:text-lg">{row.subdetail}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {model.seasonLabel ? (
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-100/70">{model.seasonLabel}</p>
            ) : null}
            <p className="max-w-sm text-[17px] leading-relaxed text-blue-50/92 sm:text-lg">{model.clubLine}</p>
          </div>
        )}

        {rows.length > 0 && model.clubLine ? (
          <p className="mt-auto pt-8 text-[12px] font-semibold uppercase tracking-[0.16em] text-blue-100/55">
            {model.clubLine}
          </p>
        ) : null}
      </div>
    </div>
  );
}
