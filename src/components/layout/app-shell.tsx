"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CLUB_NAME, TEAM_DISPLAY_LABEL } from "@/constants/club";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import { SeasonSwitcher } from "@/components/layout/season-switcher";
import type { Season } from "@/types";

const baseNav = [
  { href: "/", label: "Home" },
  { href: "/selectie", label: "Selectie" },
  { href: "/wedstrijden", label: "Wedstrijden" },
  { href: "/ranking", label: "Ranking" },
  { href: "/training", label: "Training" },
  { href: "/fitheid", label: "Fitheid" },
  { href: "/seizoenen", label: "Seizoenen" },
] as const;

const beheerNav = { href: "/beheer", label: "Beheer" } as const;

export function AppShell({
  children,
  seasons,
  currentSeasonId,
  isAdmin,
}: {
  children: React.ReactNode;
  seasons: Season[];
  currentSeasonId: string;
  isAdmin: boolean;
}) {
  const nav = isAdmin ? [...baseNav, beheerNav] : [...baseNav];
  const pathname = usePathname();
  const { mobileNavOpen, setMobileNavOpen } = useUiStore();

  return (
    <div className="relative z-[1] min-h-screen pb-24">
      <div className="h-1 bg-gradient-to-r from-zvv-blue-deep via-zvv-primary to-zvv-blue-deep" aria-hidden />
      <header className="sticky top-0 z-50 border-b border-zvv-border bg-white shadow-[0_1px_0_rgba(15,23,42,0.06)]">
        <div className="mx-auto flex max-w-[100rem] items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zvv-border bg-zvv-primary text-white shadow-md transition-all duration-300 group-hover:shadow-lg md:h-11 md:w-11">
              <span className="font-[family-name:var(--font-display)] text-lg leading-none tracking-widest">Z</span>
            </div>
            <div className="hidden leading-tight sm:block">
              <span className="font-[family-name:var(--font-display)] text-[1.35rem] tracking-wide text-zvv-ink md:text-[1.65rem]">{CLUB_NAME}</span>
              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wider text-zvv-muted">{TEAM_DISPLAY_LABEL}</span>
            </div>
          </Link>

          <nav className="hidden items-stretch gap-0.5 lg:flex">
            {nav.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  prefetch
                  href={`${item.href}?season=${encodeURIComponent(currentSeasonId || seasons[0]?.id || "")}`}
                  className={cn(
                    "relative px-3 py-3 text-[13px] font-medium transition-colors md:px-3.5",
                    active ? "text-zvv-primary" : "text-zvv-muted hover:text-zvv-ink",
                  )}
                >
                  {active ? <span className="absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-zvv-primary" /> : null}
                  {item.label}
                </Link>
              );
            })}
            <div className="ml-3 flex items-center gap-3 border-l border-zvv-border pl-4">
              <SeasonSwitcher seasons={seasons} currentSeasonId={currentSeasonId} />
              {isAdmin ? (
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="rounded-lg border border-zvv-border bg-zvv-card-mid px-3 py-2 text-xs font-semibold text-zvv-muted transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                  >
                    Uitloggen
                  </button>
                </form>
              ) : null}
            </div>
          </nav>

          <div className="flex items-center gap-2 lg:hidden">
            <SeasonSwitcher seasons={seasons} currentSeasonId={currentSeasonId} compact />
            {isAdmin ? (
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="rounded-lg border border-zvv-border bg-zvv-card-mid px-2.5 py-2 text-[11px] font-semibold text-zvv-muted"
                >
                  Uit
                </button>
              </form>
            ) : null}
            <button
              type="button"
              className="rounded-lg border border-zvv-border bg-zvv-primary px-3 py-2 text-xs font-semibold text-white shadow-sm"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              aria-expanded={mobileNavOpen}
            >
              Menu
            </button>
          </div>
        </div>

        {mobileNavOpen ? (
          <div className="border-t border-zvv-border bg-white lg:hidden">
            <div className="flex flex-col px-2 py-3">
              {nav.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={`${item.href}?season=${encodeURIComponent(currentSeasonId || seasons[0]?.id || "")}`}
                    prefetch
                    className={cn(
                      "rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                      active ? "bg-zvv-primary-muted text-zvv-primary" : "text-zvv-muted hover:bg-zvv-card-mid hover:text-zvv-ink",
                    )}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </header>

      <main
        className={cn(
          "relative",
          pathname === "/" ? "w-full p-0" : "mx-auto max-w-[100rem] px-4 py-12 md:px-8 md:py-16",
        )}
      >
        {children}
      </main>
    </div>
  );
}
