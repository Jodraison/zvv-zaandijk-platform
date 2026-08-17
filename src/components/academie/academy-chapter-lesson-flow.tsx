import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ResolvedAcademyChapterLesson } from "@/lib/academie/chapter-types";

function FlowNode({
  lesson,
  isLast,
}: {
  lesson: ResolvedAcademyChapterLesson;
  isLast: boolean;
}) {
  const isAvailable = lesson.status === "available";

  const node = (
    <div
      className={cn(
        "flex min-w-[4.5rem] flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5 text-center transition-colors sm:min-w-[5.5rem]",
        lesson.isActive
          ? "border-zvv-primary bg-zvv-primary-muted shadow-sm"
          : isAvailable
            ? "border-zvv-border/80 bg-white/90 hover:border-zvv-primary/30"
            : "border-zvv-border/60 bg-zvv-card-mid/40 text-zvv-muted",
      )}
    >
      <span className="font-[family-name:var(--font-display)] text-lg tracking-wide text-zvv-primary">
        {String(lesson.lessonNumber).padStart(2, "0")}
      </span>
      <span className="max-w-[5.5rem] truncate text-[10px] font-semibold leading-tight text-zvv-ink">{lesson.title}</span>
    </div>
  );

  return (
    <>
      {isAvailable ? (
        <Link
          href={lesson.href}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zvv-primary/40 focus-visible:ring-offset-2 rounded-xl"
          aria-current={lesson.isActive ? "step" : undefined}
        >
          {node}
        </Link>
      ) : (
        <div aria-disabled>{node}</div>
      )}
      {!isLast ? (
        <span className="my-1 text-zvv-primary/50 md:hidden" aria-hidden>
          ↓
        </span>
      ) : null}
    </>
  );
}

export function AcademyChapterLessonFlow({ lessons }: { lessons: ResolvedAcademyChapterLesson[] }) {
  return (
    <section aria-labelledby="chapter-flow-heading">
      <p id="chapter-flow-heading" className="club-page-eyebrow">
        Lesvolgorde
      </p>
      <p className="mt-1 text-sm text-zvv-muted">
        Volgorde: identiteit → kiezen → uitvoeren → gedrag → tempo → focus onder druk.
      </p>

      <ol className="mt-5 flex list-none flex-col items-center gap-0 p-0 md:flex-row md:flex-wrap md:items-start md:justify-start md:gap-y-3">
        {lessons.map((lesson, index) => (
          <li key={lesson.topicId} className="flex flex-col items-center md:flex-row">
            <FlowNode lesson={lesson} isLast={index === lessons.length - 1} />
            {index < lessons.length - 1 ? (
              <span className="hidden px-1 text-lg text-zvv-primary/40 md:inline" aria-hidden>
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
