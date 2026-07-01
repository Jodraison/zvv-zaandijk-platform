import Link from "next/link";
import { cn } from "@/lib/utils";

export type AcademyBreadcrumbItem = {
  label: string;
  href?: string;
};

export function AcademyBreadcrumbs({ items }: { items: AcademyBreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1" role="list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 ? (
                <span className="text-zvv-muted" aria-hidden>
                  →
                </span>
              ) : null}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="font-semibold text-zvv-primary transition-colors hover:text-zvv-primary-hover hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={cn("font-semibold", isLast ? "text-zvv-ink" : "text-zvv-muted")} aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
