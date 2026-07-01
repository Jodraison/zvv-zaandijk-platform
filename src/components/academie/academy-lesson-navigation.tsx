import Link from "next/link";
import { cn } from "@/lib/utils";
import type { AcademyChapterLessonNav } from "@/lib/academie/chapter-types";

function NavLink({
  direction,
  title,
  href,
  lessonNumber,
  disabled,
}: {
  direction: "previous" | "next";
  title: string;
  href?: string;
  lessonNumber?: number;
  disabled?: boolean;
}) {
  const label = direction === "previous" ? "Vorige les" : "Volgende les";
  const arrow = direction === "previous" ? "←" : "→";

  if (disabled || !href) {
    return (
      <div
        className={cn(
          "flex min-h-[72px] flex-1 flex-col justify-center rounded-2xl border border-dashed border-zvv-border/70 bg-zvv-card-mid/20 px-4 py-4 opacity-60",
          direction === "next" && "items-end text-right",
        )}
        aria-hidden
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zvv-muted">{label}</span>
        <span className="mt-1 text-sm text-zvv-muted">—</span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "group flex min-h-[72px] flex-1 flex-col justify-center rounded-2xl border border-zvv-border/80 bg-white/90 px-4 py-4 transition-colors hover:border-zvv-primary/25 hover:bg-zvv-primary-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zvv-primary/40 focus-visible:ring-offset-2",
        direction === "next" && "items-end text-right",
      )}
      rel={direction === "previous" ? "prev" : "next"}
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zvv-muted">{label}</span>
      <span className="mt-1 flex items-center gap-2 font-semibold text-zvv-ink group-hover:text-zvv-primary">
        {direction === "previous" ? (
          <>
            <span aria-hidden>{arrow}</span>
            <span className="truncate">
              {lessonNumber != null ? `${String(lessonNumber).padStart(2, "0")}. ` : ""}
              {title}
            </span>
          </>
        ) : (
          <>
            <span className="truncate">
              {lessonNumber != null ? `${String(lessonNumber).padStart(2, "0")}. ` : ""}
              {title}
            </span>
            <span aria-hidden>{arrow}</span>
          </>
        )}
      </span>
    </Link>
  );
}

export function AcademyLessonNavigation({ nav }: { nav: AcademyChapterLessonNav }) {
  return (
    <nav aria-label="Lesnavigatie binnen chapter" className="border-t border-zvv-border/60 pt-8 md:pt-10">
      <p className="club-page-eyebrow">
        Chapter {nav.chapterNumber} · Les {nav.current} van {nav.total}
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:gap-4">
        <NavLink
          direction="previous"
          title={nav.previous?.title ?? ""}
          href={nav.previous?.href}
          lessonNumber={nav.previous?.lessonNumber}
          disabled={!nav.previous}
        />
        <NavLink
          direction="next"
          title={nav.next?.title ?? ""}
          href={nav.next?.href}
          lessonNumber={nav.next?.lessonNumber}
          disabled={!nav.next}
        />
      </div>
    </nav>
  );
}
