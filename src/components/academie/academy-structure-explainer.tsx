import { GlassCard } from "@/components/layout/glass-card";

const STRUCTURE_STEPS = [
  {
    label: "Academy",
    description: "Het overzicht — waar je alles vindt.",
  },
  {
    label: "Categorie",
    description: "Een hoofdonderwerp, zoals Speelwijze of Posities.",
  },
  {
    label: "Onderwerp",
    description: "Een specifiek thema binnen die categorie.",
  },
  {
    label: "Praktische uitleg",
    description: "De uitleg die je direct kunt toepassen op het veld.",
  },
] as const;

export function AcademyStructureExplainer() {
  return (
    <GlassCard className="club-card-lift bg-gradient-to-br from-white to-zvv-card-mid/35">
      <p className="club-page-eyebrow">Opbouw</p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.5rem,3.5vw,2.25rem)] tracking-wide text-zvv-ink">
        Hoe is de Academy opgebouwd?
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zvv-muted md:text-[15px]">
        Alles in de Football Academy volgt dezelfde logica: van het grote plaatje naar concrete uitleg die je meteen
        kunt gebruiken.
      </p>
      <ol className="mt-8 flex flex-col gap-0 sm:gap-0" aria-label="Opbouw van de Football Academy">
        {STRUCTURE_STEPS.map((step, index) => (
          <li key={step.label} className="flex gap-4 sm:gap-5">
            <div className="flex flex-col items-center">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zvv-primary/30 bg-zvv-primary-muted text-sm font-bold text-zvv-primary">
                {index + 1}
              </span>
              {index < STRUCTURE_STEPS.length - 1 ? (
                <span className="my-1 w-px flex-1 bg-gradient-to-b from-zvv-primary/40 to-zvv-primary/10" aria-hidden />
              ) : null}
            </div>
            <div className={index < STRUCTURE_STEPS.length - 1 ? "pb-6 sm:pb-7" : ""}>
              <p className="font-[family-name:var(--font-display)] text-lg tracking-wide text-zvv-ink sm:text-xl">{step.label}</p>
              <p className="mt-1 text-sm leading-relaxed text-zvv-muted">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </GlassCard>
  );
}
