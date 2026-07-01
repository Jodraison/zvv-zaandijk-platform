import Link from "next/link";
import { GlassCard } from "@/components/layout/glass-card";
import { Badge } from "@/components/layout/badge";
import { cn } from "@/lib/utils";
import {
  ACADEMY_CHAPTER_LESSON_STATUS_LABELS,
  ACADEMY_LESSON_CONTENT_LEVEL_LABELS,
} from "@/lib/academie/chapter-utils";
import type { ResolvedAcademyChapterLesson } from "@/lib/academie/chapter-types";

function LessonNumberBadge({ number, status }: { number: number; status: ResolvedAcademyChapterLesson["status"] }) {
  return (
    <span
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-[family-name:var(--font-display)] text-lg tracking-wide",
        status === "available" ? "bg-zvv-primary-muted text-zvv-primary" : "bg-zvv-card-mid text-zvv-muted",
      )}
      aria-hidden
    >
      {String(number).padStart(2, "0")}
    </span>
  );
}

export function AcademyChapterLessonCard({ lesson }: { lesson: ResolvedAcademyChapterLesson }) {
  const isAvailable = lesson.status === "available";
  const statusLabel = ACADEMY_CHAPTER_LESSON_STATUS_LABELS[lesson.status];
  const levelLabel = ACADEMY_LESSON_CONTENT_LEVEL_LABELS[lesson.lessonLevel];

  const card = (
    <GlassCard
      className={cn(
        "h-full transition-all duration-300",
        isAvailable && "motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-zvv-primary/25 motion-safe:hover:shadow-[var(--shadow-zvv-lift)]",
        !isAvailable && "opacity-90",
      )}
    >
      <div className="flex gap-4">
        <LessonNumberBadge number={lesson.lessonNumber} status={lesson.status} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-xl leading-none" aria-hidden>
              {lesson.icon}
            </p>
            <Badge tone={isAvailable ? "live" : "gold"} className="shrink-0">
              {statusLabel}
            </Badge>
          </div>
          <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl tracking-wide text-zvv-ink md:text-2xl">{lesson.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-zvv-muted">{lesson.description}</p>
          <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs">
            <div>
              <dt className="sr-only">Leestijd</dt>
              <dd className="font-semibold text-zvv-muted">± {lesson.estimatedReadingTime} min</dd>
            </div>
            <div>
              <dt className="sr-only">Moeilijkheid</dt>
              <dd className="font-semibold text-zvv-muted">{levelLabel}</dd>
            </div>
          </dl>
          {isAvailable ? (
            <span className="mt-4 inline-block text-xs font-bold uppercase tracking-wider text-zvv-primary">Start les →</span>
          ) : (
            <span className="mt-4 inline-block text-xs font-bold uppercase tracking-wider text-zvv-muted">Nog niet beschikbaar</span>
          )}
        </div>
      </div>
    </GlassCard>
  );

  if (!isAvailable) {
    return (
      <div aria-disabled className="block h-full cursor-default">
        {card}
      </div>
    );
  }

  return (
    <Link
      href={lesson.href}
      className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zvv-primary/40 focus-visible:ring-offset-2 rounded-2xl"
    >
      {card}
    </Link>
  );
}
