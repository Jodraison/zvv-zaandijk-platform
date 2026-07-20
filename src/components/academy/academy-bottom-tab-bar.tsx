"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ACADEMY_BOTTOM_TABS } from "@/lib/academy/academy-bottom-tabs";
import {
  resolveActiveAcademyTab,
  shouldShowAcademyBottomTabBar,
} from "@/lib/academy/resolve-active-academy-tab";
import { cn } from "@/lib/utils";

/**
 * C-A02 BottomTabBar — mobile speelster only (T-01-03).
 * Desktop SidebarNav = later task; this bar is `lg:hidden`.
 */
export function AcademyBottomTabBar() {
  const pathname = usePathname() ?? "";

  if (!shouldShowAcademyBottomTabBar(pathname)) {
    return null;
  }

  const activeId = resolveActiveAcademyTab(pathname);

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-zvv-border bg-white",
        "pb-[env(safe-area-inset-bottom)] lg:hidden",
      )}
      aria-label="Academy hoofdnavigatie"
      data-academy-component="C-A02"
    >
      <ul className="mx-auto grid max-w-[100rem] grid-cols-5">
        {ACADEMY_BOTTOM_TABS.map((tab) => {
          const active = tab.id === activeId;
          return (
            <li key={tab.id} className="min-w-0">
              <Link
                href={tab.href}
                prefetch
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-2 text-center",
                  "text-[11px] font-semibold leading-tight focus-visible:outline focus-visible:outline-2",
                  "focus-visible:outline-offset-[-2px] focus-visible:outline-zvv-primary",
                  active ? "text-zvv-primary" : "text-zvv-muted hover:text-zvv-ink",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={cn(
                    "h-0.5 w-6 rounded-full",
                    active ? "bg-zvv-primary" : "bg-transparent",
                  )}
                  aria-hidden
                />
                <span className="truncate">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
