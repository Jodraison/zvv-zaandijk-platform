import type { ReactNode } from "react";
import { Badge } from "@/components/layout/badge";
import { GlassCard } from "@/components/layout/glass-card";
import { AcademyLessonComparePitch, AcademyLessonMistakePitch } from "@/components/academie/academy-lesson-compare-svgs";
import { TacticalComparisonSideCard } from "@/components/academie/tactical-comparison-side-card";
import { TacticalPressureDualCard } from "@/components/academie/tactical-pressure-dual-card";
import { AcademyLessonFieldSvg } from "@/components/academie/academy-lesson-field-svg";
import { AcademyLessonPositionPicker } from "@/components/academie/academy-lesson-position-picker";
import type { AcademyLesson } from "@/lib/academie/lesson-types";
import {
  ACADEMY_LESSON_LEVEL_LABELS,
  type AcademyLessonAgreementCard,
  type AcademyLessonChoiceCompare,
  type AcademyLessonChoiceMoment,
  type AcademyLessonCoachingChip,
  type AcademyLessonDecisionBranch,
  type AcademyLessonDecisionStep,
  type AcademyLessonMatchMoment,
  type AcademyLessonMistakePair,
  type AcademyLessonPositionCard,
  type AcademyLessonStandardV1,
} from "@/lib/academie/lesson-standard-v1";
import { hasLessonText } from "@/lib/academie/lesson-utils";
import { cn } from "@/lib/utils";

const V2_GAP = "space-y-8 md:space-y-10";

type SectionIcon = "target" | "pitch" | "eye" | "tree" | "pin" | "alert" | "mic" | "flag" | "users";

function SectionGlyph({ name }: { name: SectionIcon }) {
  const common = "h-5 w-5 text-zvv-primary";
  switch (name) {
    case "pitch":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M12 5v14M3 12h18" />
        </svg>
      );
    case "eye":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "tree":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M12 4v4M8 12h8M6 18h12M12 8v10" />
          <circle cx="12" cy="4" r="1.5" fill="currentColor" />
          <circle cx="8" cy="12" r="1.5" fill="currentColor" />
          <circle cx="16" cy="12" r="1.5" fill="currentColor" />
          <circle cx="6" cy="18" r="1.5" fill="currentColor" />
          <circle cx="18" cy="18" r="1.5" fill="currentColor" />
        </svg>
      );
    case "pin":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case "alert":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M12 3 2.5 20h19L12 3Z" />
          <path d="M12 9v5M12 17h.01" />
        </svg>
      );
    case "mic":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
      );
    case "flag":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M5 21V4h9l-1.5 3.5L14 11H5" />
        </svg>
      );
    case "users":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="9" cy="8" r="3" />
          <circle cx="16" cy="9" r="2.5" />
          <path d="M3 19c0-3 3-5 6-5s6 2 6 5M13 19c.4-1.8 2-3 4-3 1.6 0 3 .8 3.7 2" />
        </svg>
      );
    case "target":
    default:
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="1.4" fill="currentColor" />
        </svg>
      );
  }
}

function CoachCard({
  id,
  icon,
  title,
  children,
  className,
}: {
  id: string;
  icon: SectionIcon;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("scroll-mt-24", className)}>
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zvv-primary-muted">
          <SectionGlyph name={icon} />
        </span>
        <h2
          id={`${id}-title`}
          className="font-[family-name:var(--font-display)] text-[clamp(1.45rem,3vw,1.9rem)] tracking-wide text-zvv-ink"
        >
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function pairDecisionSteps(steps: AcademyLessonDecisionStep[]) {
  const start = steps.find((s) => s.kind === "start");
  const end = steps.find((s) => s.kind === "end");
  const pairs: { ifStep: AcademyLessonDecisionStep; thenStep: AcademyLessonDecisionStep }[] = [];
  const middle = steps.filter((s) => s.kind === "if" || s.kind === "then");
  for (let i = 0; i < middle.length; i += 1) {
    const current = middle[i];
    const next = middle[i + 1];
    if (current.kind === "if" && next?.kind === "then") {
      pairs.push({ ifStep: current, thenStep: next });
      i += 1;
    }
  }
  return { start, pairs, end };
}

export function AcademyLessonStandardHero({
  lesson,
  standard,
}: {
  lesson: AcademyLesson;
  standard?: AcademyLessonStandardV1;
}) {
  const readingTime = lesson.estimatedReadingTime ?? lesson.quickReference?.readingTimeMinutes;
  const level =
    standard?.levelLabel ?? (lesson.lessonLevel ? ACADEMY_LESSON_LEVEL_LABELS[lesson.lessonLevel] : undefined);

  return (
    <header className="club-section-surface club-reveal space-y-5 border-b border-zvv-border/60 pb-8 md:pb-10">
      <p className="club-page-eyebrow">Les</p>
      <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.1rem,6vw,3.5rem)] leading-[0.96] tracking-wide text-zvv-ink">
        {lesson.title}
      </h1>
      {lesson.summary ? (
        <p className="max-w-xl text-[15px] leading-snug text-zvv-muted md:text-base">{lesson.summary}</p>
      ) : null}
      {standard?.traitChips && standard.traitChips.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {standard.traitChips.map((trait) => (
            <span
              key={trait}
              className="inline-flex items-center rounded-full border border-zvv-primary/25 bg-zvv-primary-muted px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-zvv-primary"
            >
              {trait}
            </span>
          ))}
        </div>
      ) : null}
      {hasLessonText(lesson.keyTakeaway) ? (
        <p className="max-w-xl border-l-4 border-zvv-primary bg-zvv-primary-muted/40 px-4 py-3 text-[15px] font-semibold leading-snug text-zvv-ink">
          {lesson.keyTakeaway}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2.5">
        {typeof readingTime === "number" ? <Badge tone="muted">± {readingTime} min</Badge> : null}
        {level ? <Badge tone="live">{level}</Badge> : null}
        {standard?.updatedAt ? <Badge tone="gold">{standard.updatedAt}</Badge> : null}
      </div>
    </header>
  );
}

function LearningOutcomes({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <CoachCard id="lesson-learning-outcomes" icon="target" title="Wat leer je">
      <ul className="space-y-2.5" role="list">
        {items.slice(0, 3).map((item) => (
          <li
            key={item}
            className="flex gap-3 rounded-2xl border border-zvv-border/80 bg-white px-4 py-3.5 text-[15px] leading-snug text-zvv-ink"
          >
            <span className="font-bold text-emerald-600" aria-hidden>
              ✓
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </CoachCard>
  );
}

function Situation({
  title,
  explanation,
  note,
  fieldPreset = "default",
  situationId,
}: {
  title?: string;
  explanation?: string;
  note?: string;
  fieldPreset?: AcademyLessonStandardV1["situation"] extends infer S
    ? S extends { fieldPreset?: infer P }
      ? P
      : never
    : never;
  situationId?: string;
}) {
  return (
    <CoachCard id="lesson-situation" icon="pitch" title={title ?? "Wedstrijdsituatie"}>
      {explanation ? <p className="mb-4 max-w-prose text-[15px] leading-snug text-zvv-muted">{explanation}</p> : null}
      <AcademyLessonFieldSvg preset={fieldPreset ?? "default"} situationId={situationId} />
      {hasLessonText(note) ? (
        <p className="mt-4 rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm font-semibold leading-snug text-amber-950">
          {note}
        </p>
      ) : null}
    </CoachCard>
  );
}

function RecognizeCompare({
  compare,
  title = "Goed of niet?",
}: {
  compare: {
    good: string;
    bad: string;
    goodSituationId?: string;
    badSituationId?: string;
    goodTitle?: string;
    badTitle?: string;
    goodConsequence?: string;
    badConsequence?: string;
  };
  title?: string;
}) {
  const badId = compare.badSituationId ?? "press-bad";
  const goodId = compare.goodSituationId ?? "press-good";
  const isPressurePair = badId === "press-bad" && goodId === "press-good";

  if (isPressurePair) {
    return (
      <CoachCard id="lesson-recognize" icon="eye" title={title}>
        <div className="flex flex-col gap-5" data-pressure-compare-layout="v2-stacked">
          <TacticalPressureDualCard
            variant="bad"
            label="NIET GOED"
            title={compare.badTitle ?? "Niet goed"}
            situationId={badId}
            takeaway={compare.bad}
            consequence={compare.badConsequence}
          />
          <TacticalPressureDualCard
            variant="good"
            label="GOED"
            title={compare.goodTitle ?? "Goed"}
            situationId={goodId}
            takeaway={compare.good}
            consequence={compare.goodConsequence}
          />
        </div>
      </CoachCard>
    );
  }

  return (
    <CoachCard id="lesson-recognize" icon="eye" title={title}>
      <div className="grid gap-4 md:grid-cols-2 md:items-stretch">
        <TacticalComparisonSideCard
          variant="bad"
          label="NIET GOED"
          title={compare.badTitle ?? "Niet goed"}
          situationId={badId}
          takeaway={compare.bad}
          consequence={compare.badConsequence}
        />
        <TacticalComparisonSideCard
          variant="good"
          label="GOED"
          title={compare.goodTitle ?? "Goed"}
          situationId={goodId}
          takeaway={compare.good}
          consequence={compare.goodConsequence}
        />
      </div>
    </CoachCard>
  );
}

function ChoiceCompare({
  compare,
  title = "Twee keuzes",
}: {
  compare: AcademyLessonChoiceCompare;
  title?: string;
}) {
  return (
    <CoachCard id="lesson-recognize" icon="eye" title={title}>
      <div className="grid gap-4 md:grid-cols-2 md:items-stretch">
        <article className="flex h-full flex-col gap-2.5 rounded-2xl border border-amber-200/90 bg-amber-50/40 p-2.5 sm:p-3">
          <header>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-800">Keuze A</p>
            <h3 className="mt-1 text-sm font-bold leading-snug text-zvv-ink sm:text-base">{compare.left.title}</h3>
          </header>
          <AcademyLessonComparePitch situationId={compare.left.situationId} />
          <p className="rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2.5 text-sm font-semibold leading-snug text-amber-950">
            {compare.left.text}
          </p>
        </article>
        <article className="flex h-full flex-col gap-2.5 rounded-2xl border border-sky-200/90 bg-sky-50/40 p-2.5 sm:p-3">
          <header>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-800">Keuze B</p>
            <h3 className="mt-1 text-sm font-bold leading-snug text-zvv-ink sm:text-base">{compare.right.title}</h3>
          </header>
          <AcademyLessonComparePitch situationId={compare.right.situationId} />
          <p className="rounded-xl border border-sky-200 bg-sky-50/90 px-3 py-2.5 text-sm font-semibold leading-snug text-sky-950">
            {compare.right.text}
          </p>
        </article>
      </div>
      {hasLessonText(compare.nuance) ? (
        <p className="mt-4 rounded-2xl border border-zvv-border bg-white px-4 py-3 text-sm font-semibold leading-snug text-zvv-ink">
          {compare.nuance}
        </p>
      ) : null}
    </CoachCard>
  );
}

function DecisionBranchTree({
  branch,
  title = "Beslisboom",
}: {
  branch: AcademyLessonDecisionBranch;
  title?: string;
}) {
  const yesFollow = branch.yesFollowUp;
  const noFollow = branch.followUp;
  const multi = !!yesFollow || !!noFollow;

  return (
    <CoachCard id="lesson-decision-tree" icon="tree" title={title}>
      <div className="mx-auto flex max-w-lg flex-col items-center gap-2">
        <div className="w-full rounded-2xl border border-zvv-primary/30 bg-zvv-primary-muted/40 px-4 py-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zvv-primary">Start</p>
          <p className="mt-1 text-base font-semibold text-zvv-ink">{branch.start}</p>
        </div>

        <span className="font-bold text-zvv-primary" aria-hidden>
          ↓
        </span>

        <div className="w-full rounded-2xl border border-sky-300 bg-sky-50 px-4 py-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700">
            {multi ? "Vraag 1" : "Vraag"}
          </p>
          <p className="mt-1 text-base font-semibold leading-snug text-zvv-ink">{branch.question}</p>
        </div>

        <span className="font-bold text-zvv-primary" aria-hidden>
          ↓
        </span>

        <div className="grid w-full gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-3 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">{branch.yes.label}</p>
            <p className="mt-2 text-sm font-semibold leading-snug text-emerald-950">
              {yesFollow ? `${branch.yes.result} ↓` : branch.yes.result}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-300 bg-amber-50 px-3 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-800">{branch.no.label}</p>
            <p className="mt-2 text-sm font-semibold leading-snug text-amber-950">
              {noFollow ? `${branch.no.result} ↓` : branch.no.result}
            </p>
          </div>
        </div>

        {yesFollow ? (
          <>
            <span className="font-bold text-zvv-primary" aria-hidden>
              ↓
            </span>
            <div className="w-full rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-800">Vraag 2</p>
              <p className="mt-1 text-sm font-semibold leading-snug text-zvv-ink">{yesFollow.question}</p>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-3 py-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">{yesFollow.yes.label}</p>
                <p className="mt-2 text-sm font-semibold leading-snug text-emerald-950">{yesFollow.yes.result}</p>
              </div>
              <div className="rounded-2xl border border-amber-300 bg-amber-50 px-3 py-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-800">{yesFollow.no.label}</p>
                <p className="mt-2 text-sm font-semibold leading-snug text-amber-950">{yesFollow.no.result}</p>
              </div>
            </div>
          </>
        ) : null}

        {noFollow ? (
          <>
            <span className="font-bold text-zvv-primary" aria-hidden>
              ↓
            </span>
            <div className="w-full rounded-2xl border border-sky-300 bg-sky-50 px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700">Vraag 2</p>
              <p className="mt-1 text-base font-semibold leading-snug text-zvv-ink">{noFollow.question}</p>
            </div>
            <span className="font-bold text-zvv-primary" aria-hidden>
              ↓
            </span>
            <div className="grid w-full gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-3 py-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">{noFollow.yes.label}</p>
                <p className="mt-2 text-sm font-semibold leading-snug text-emerald-950">{noFollow.yes.result}</p>
              </div>
              <div className="rounded-2xl border border-amber-300 bg-amber-50 px-3 py-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-800">{noFollow.no.label}</p>
                <p className="mt-2 text-sm font-semibold leading-snug text-amber-950">{noFollow.no.result}</p>
              </div>
            </div>
          </>
        ) : null}

        {hasLessonText(branch.end) ? (
          <>
            <span className="font-bold text-zvv-primary" aria-hidden>
              ↓
            </span>
            <div className="w-full rounded-2xl border border-zvv-border bg-white px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zvv-muted">Einde</p>
              <p className="mt-1 text-sm font-semibold leading-snug text-zvv-ink">{branch.end}</p>
            </div>
          </>
        ) : null}
      </div>
    </CoachCard>
  );
}

function DecisionTreeLegacy({
  steps,
  title = "Beslisboom",
}: {
  steps: AcademyLessonDecisionStep[];
  title?: string;
}) {
  if (steps.length === 0) return null;
  const { start, pairs, end } = pairDecisionSteps(steps);
  return (
    <CoachCard id="lesson-decision-tree" icon="tree" title={title}>
      <div className="mx-auto max-w-md space-y-2">
        {start ? (
          <div className="rounded-2xl border border-zvv-primary/30 bg-zvv-primary-muted/40 px-4 py-3 text-center font-semibold">
            {start.label}
          </div>
        ) : null}
        {pairs.slice(0, 3).map(({ ifStep, thenStep }) => (
          <div key={ifStep.label} className="overflow-hidden rounded-2xl border border-zvv-border">
            <div className="bg-sky-50 px-3 py-2 text-sm font-semibold">Als {ifStep.label}</div>
            <div className="bg-amber-50 px-3 py-2 text-sm font-semibold">Dan {thenStep.label}</div>
          </div>
        ))}
        {end ? (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-center font-semibold">
            {end.label}
          </div>
        ) : null}
      </div>
    </CoachCard>
  );
}

function Positions({ positions }: { positions?: AcademyLessonPositionCard[] }) {
  if (!positions?.length) return null;
  return (
    <CoachCard id="lesson-positions" icon="pin" title="Mijn positie">
      <AcademyLessonPositionPicker positions={positions} defaultOpen={false} />
    </CoachCard>
  );
}

function PositionNote({ note }: { note?: string }) {
  if (!hasLessonText(note)) return null;
  return (
    <p
      id="lesson-positions"
      className="rounded-2xl border border-zvv-border bg-white px-4 py-3 text-sm font-semibold leading-snug text-zvv-ink"
    >
      {note}
    </p>
  );
}

function Agreements({
  cards,
  title = "Vijf teamafspraken",
  cardLabel = "Afspraak",
}: {
  cards: AcademyLessonAgreementCard[];
  title?: string;
  cardLabel?: string;
}) {
  if (cards.length === 0) return null;
  return (
    <CoachCard id="lesson-agreements" icon="users" title={title}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.slice(0, 5).map((card, index) => (
          <div
            key={card.title}
            className="rounded-2xl border border-zvv-border/80 bg-white px-4 py-3.5"
          >
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zvv-primary">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zvv-primary text-[11px] text-white">
                {index + 1}
              </span>
              {cardLabel}
            </p>
            <p className="mt-2 text-sm font-bold leading-snug text-zvv-ink">{card.title}</p>
            <p className="mt-1 text-xs leading-snug text-zvv-muted">{card.body}</p>
          </div>
        ))}
      </div>
    </CoachCard>
  );
}

function MatchMoments({
  moments,
  title = "Drie wedstrijdmomenten",
}: {
  moments: AcademyLessonMatchMoment[];
  title?: string;
}) {
  if (moments.length === 0) return null;
  return (
    <CoachCard id="lesson-mistakes" icon="alert" title={title}>
      <div className="space-y-8">
        {moments.slice(0, 3).map((moment) => {
          const badLabel = (moment.agreementLabel ?? "Afspraak").toUpperCase();
          const goodLabel = (moment.actionLabel ?? "Wat jij doet").toUpperCase();
          const isTacticalPair = Boolean(moment.goodSituationId);
          if (isTacticalPair && moment.goodSituationId) {
            return (
              <div key={moment.title} className="space-y-3">
                <p className="text-sm font-bold text-zvv-ink">{moment.title}</p>
                <p className="text-xs leading-snug text-zvv-muted">{moment.situation}</p>
                <div className="grid gap-4 md:grid-cols-2 md:items-stretch">
                  <TacticalComparisonSideCard
                    variant="bad"
                    label={badLabel === "VERKEERD" || badLabel === "FOUT" ? badLabel : "VERKEERD"}
                    title={moment.badTitle ?? moment.agreement}
                    situationId={moment.situationId}
                    takeaway={moment.agreement}
                    consequence={moment.badConsequence}
                  />
                  <TacticalComparisonSideCard
                    variant="good"
                    label={goodLabel === "GEWENST" || goodLabel === "GOED" || goodLabel === "BETER" ? goodLabel : "GEWENST"}
                    title={moment.goodTitle ?? moment.action}
                    situationId={moment.goodSituationId}
                    takeaway={moment.action}
                    consequence={moment.goodConsequence ?? moment.why}
                  />
                </div>
              </div>
            );
          }
          return (
            <div key={moment.title} className="space-y-3">
              <AcademyLessonMistakePitch situationId={moment.situationId} />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-zvv-border bg-white px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zvv-muted">Situatie</p>
                  <p className="mt-1 text-sm font-semibold leading-snug text-zvv-ink">{moment.situation}</p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-rose-700">
                    {moment.agreementLabel ?? "Afspraak"}
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-snug text-zvv-ink">{moment.agreement}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                    {moment.actionLabel ?? "Wat jij doet"}
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-snug text-emerald-950">{moment.action}</p>
                  <p className="mt-2 text-xs leading-snug text-emerald-900/90">{moment.why}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </CoachCard>
  );
}

function ChoiceMoments({
  moments,
  title = "Drie keuzemomenten",
}: {
  moments: AcademyLessonChoiceMoment[];
  title?: string;
}) {
  if (moments.length === 0) return null;
  return (
    <CoachCard id="lesson-mistakes" icon="alert" title={title}>
      <div className="space-y-8">
        {moments.slice(0, 3).map((moment) => (
          <div key={moment.title} className="space-y-3">
            <AcademyLessonMistakePitch situationId={moment.situationId} />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-zvv-border bg-white px-3 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zvv-muted">Situatie</p>
                <p className="mt-1 text-sm font-semibold leading-snug text-zvv-ink">{moment.situation}</p>
                <p className="mt-2 text-xs leading-snug text-zvv-muted">A · {moment.choiceA}</p>
                <p className="mt-1 text-xs leading-snug text-zvv-muted">B · {moment.choiceB}</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">Beste keuze</p>
                <p className="mt-1 text-sm font-semibold leading-snug text-emerald-950">{moment.best}</p>
                <p className="mt-2 text-xs leading-snug text-emerald-900/90">{moment.why}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </CoachCard>
  );
}

const MISTAKE_DEFAULT_GOOD: Record<string, string> = {
  solo: "solo-support",
  "blind-run": "blind-press",
  "always-forward": "forward-relocate",
  freeze: "solo-support",
  silent: "solo-support",
};

const MISTAKE_DEFAULT_BAD: Record<string, string> = {
  solo: "solo-solve",
  "blind-run": "blind-run",
  "always-forward": "always-forward",
  freeze: "solo-solve",
  silent: "solo-solve",
};

function Mistakes({ pairs }: { pairs: AcademyLessonMistakePair[] }) {
  if (pairs.length === 0) return null;
  return (
    <CoachCard id="lesson-mistakes" icon="alert" title="Zaterdag-fouten">
      <div className="space-y-8">
        {pairs.slice(0, 3).map((pair) => {
          const lines = pair.wrong.split("\n").map((l) => l.trim()).filter(Boolean);
          const badId =
            pair.badSituationId ??
            MISTAKE_DEFAULT_BAD[pair.visual ?? "solo"] ??
            "solo-solve";
          const goodId =
            pair.goodSituationId ??
            MISTAKE_DEFAULT_GOOD[pair.visual ?? "solo"] ??
            "solo-support";
          const badTitle = pair.badTitle ?? lines[0] ?? "Fout";
          const goodTitle = pair.goodTitle ?? pair.better;
          return (
            <div
              key={`${badId}-${goodId}-${pair.wrong}`}
              className="grid gap-4 md:grid-cols-2 md:items-stretch"
              data-comparison-pair={badId}
            >
              <TacticalComparisonSideCard
                variant="bad"
                label="FOUT"
                title={badTitle}
                description={lines[1]}
                situationId={badId}
                takeaway={pair.badTakeaway ?? lines[0] ?? pair.wrong}
                consequence={pair.badConsequence ?? lines[1]}
              />
              <TacticalComparisonSideCard
                variant="good"
                label="BETER"
                title={goodTitle}
                situationId={goodId}
                takeaway={pair.goodTakeaway ?? pair.better}
                consequence={pair.goodConsequence}
              />
            </div>
          );
        })}
      </div>
    </CoachCard>
  );
}

/** Chips + compacte legenda — geen accordion-frictie voor korte definities. */
function CoachingChips({ chips }: { chips: AcademyLessonCoachingChip[] }) {
  if (chips.length === 0) return null;
  return (
    <CoachCard id="lesson-coaching" icon="mic" title="Coachtaal">
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span
            key={chip.label}
            className="rounded-full border border-zvv-primary/25 bg-zvv-primary-muted px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-zvv-primary"
          >
            {chip.label}
          </span>
        ))}
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2" role="list">
        {chips.map((chip) => (
          <li key={`${chip.label}-m`} className="rounded-xl border border-zvv-border/70 bg-white/90 px-3 py-2.5 text-sm">
            <span className="font-bold uppercase tracking-wide text-zvv-ink">{chip.label}</span>
            <span className="mt-0.5 block leading-snug text-zvv-muted">{chip.meaning}</span>
          </li>
        ))}
      </ul>
    </CoachCard>
  );
}

function VideoSlot({
  provider = "youtube",
  title,
  caption,
}: {
  provider?: "youtube" | "vimeo";
  title?: string;
  caption?: string;
}) {
  return (
    <CoachCard id="lesson-video" icon="flag" title="Video">
      <GlassCard className="overflow-hidden border-dashed border-zvv-border bg-zvv-ink p-0">
        <div className="flex aspect-video flex-col items-center justify-center gap-2 bg-gradient-to-br from-zvv-ink via-[#152033] to-zvv-blue-deep px-6 text-center">
          <p className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-white">
            {title ?? "Video"}
          </p>
          <p className="max-w-sm text-sm text-blue-100/85">
            {caption ?? `${provider === "vimeo" ? "Vimeo" : "YouTube"} · volgt later`}
          </p>
        </div>
      </GlassCard>
    </CoachCard>
  );
}

function Summary({ items, closingNote }: { items: string[]; closingNote?: string }) {
  if (items.length === 0) return null;
  return (
    <CoachCard id="lesson-summary" icon="flag" title="Onthoud alleen dit">
      <ul className="space-y-2.5" role="list">
        {items.slice(0, 3).map((item, index) => (
          <li
            key={item}
            className="flex gap-3 rounded-2xl border border-zvv-border/80 bg-white px-4 py-3.5 text-[15px] font-semibold leading-snug text-zvv-ink"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zvv-primary text-xs font-bold text-white">
              {index + 1}
            </span>
            <span className="pt-0.5">{item}</span>
          </li>
        ))}
      </ul>
      {hasLessonText(closingNote) ? (
        <p className="mt-5 border-l-4 border-zvv-primary px-4 py-2 text-sm font-semibold leading-snug text-zvv-ink">
          {closingNote}
        </p>
      ) : null}
    </CoachCard>
  );
}

export function AcademyLessonStandardBody({ standard }: { standard: AcademyLessonStandardV1 }) {
  const showVideo = !!standard.video && standard.video.placeholder !== true;
  const hasBranch = !!standard.decisionBranch;
  const hasLegacyTree = !hasBranch && (standard.decisionTree?.length ?? 0) > 0;

  return (
    <div className={V2_GAP}>
      <LearningOutcomes items={standard.learningOutcomes ?? []} />

      <Situation
        title={standard.situation?.title}
        explanation={standard.situation?.explanation}
        note={standard.situation?.note}
        fieldPreset={standard.situation?.fieldPreset}
        situationId={standard.situation?.situationId}
      />

      {standard.agreements?.length ? (
        <Agreements
          cards={standard.agreements}
          title={standard.agreementsTitle ?? "Vijf teamafspraken"}
          cardLabel={standard.agreementsCardLabel ?? "Afspraak"}
        />
      ) : null}

      {!standard.positions?.length ? <PositionNote note={standard.positionNote} /> : null}

      {standard.choiceCompare ? (
        <ChoiceCompare
          compare={standard.choiceCompare}
          title={standard.choiceCompareTitle ?? "Twee keuzes"}
        />
      ) : null}

      {!standard.choiceCompare && standard.recognizeCompare ? (
        <RecognizeCompare compare={standard.recognizeCompare} title={standard.recognizeTitle ?? "Goed of niet?"} />
      ) : null}

      {hasBranch ? (
        <DecisionBranchTree
          branch={standard.decisionBranch!}
          title={standard.decisionTreeTitle ?? "Beslisboom"}
        />
      ) : null}

      {hasLegacyTree ? (
        <DecisionTreeLegacy
          steps={standard.decisionTree ?? []}
          title={standard.decisionTreeTitle ?? "Beslisboom"}
        />
      ) : null}

      <Positions positions={standard.positions} />
      {standard.matchMoments?.length ? (
        <MatchMoments
          moments={standard.matchMoments}
          title={standard.matchMomentsTitle ?? "Drie wedstrijdmomenten"}
        />
      ) : standard.choiceMoments?.length ? (
        <ChoiceMoments
          moments={standard.choiceMoments}
          title={standard.choiceMomentsTitle ?? "Drie keuzemomenten"}
        />
      ) : (
        <Mistakes pairs={standard.mistakes ?? []} />
      )}
      <CoachingChips chips={standard.coachingChips ?? []} />

      {showVideo ? (
        <VideoSlot
          provider={standard.video?.provider}
          title={standard.video?.title}
          caption={standard.video?.caption}
        />
      ) : null}

      <Summary items={standard.summaryPoints ?? []} closingNote={standard.closingNote} />
    </div>
  );
}
