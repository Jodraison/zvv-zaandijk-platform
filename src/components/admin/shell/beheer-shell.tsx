"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  BEHEER_NAV_GROUP_LABELS,
  BEHEER_OPS_NAV,
  BEHEER_PRIMARY_NAV,
  isBeheerNavActive,
  withSeason,
} from "@/lib/admin/beheer-nav";

const navLinkBase =
  "relative rounded-xl py-2.5 pl-3.5 pr-3 text-[0.9375rem] font-medium leading-snug transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zvv-primary";

function navLinkClass(active: boolean) {
  return cn(
    navLinkBase,
    active
      ? "border-l-[3px] border-zvv-primary bg-zvv-primary-muted text-zvv-primary shadow-sm"
      : "border-l-[3px] border-transparent text-zvv-muted hover:border-zvv-primary/25 hover:bg-zvv-card-mid hover:text-zvv-ink",
  );
}

export function BeheerShell({
  children,
  seasonId,
  showSeasons = true,
  showOps = true,
  roleLabel = null,
}: {
  children: React.ReactNode;
  seasonId: string;
  showSeasons?: boolean;
  showOps?: boolean;
  roleLabel?: string | null;
}) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const primary = BEHEER_PRIMARY_NAV.filter((item) => showSeasons || item.href !== "/beheer/seizoenen");

  return (
    <div className="mx-auto w-full max-w-[100rem]">
      <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
        <p className="text-sm font-semibold text-zvv-ink">Teambeheer{roleLabel ? ` · ${roleLabel}` : ""}</p>
        <button
          type="button"
          className="min-h-11 rounded-xl border border-zvv-border bg-white px-4 py-2 text-sm font-semibold text-zvv-ink shadow-sm"
          aria-expanded={navOpen}
          onClick={() => setNavOpen((v) => !v)}
        >
          Menu
        </button>
      </div>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[16.5rem_minmax(0,1fr)]">
        <aside
          className={cn(
            "rounded-2xl border border-zvv-border bg-white p-3 shadow-[0_8px_28px_rgba(15,23,42,0.06)] lg:sticky lg:top-24 lg:self-start",
            navOpen ? "block" : "hidden lg:block",
          )}
        >
          {roleLabel ? (
            <p className="hidden px-3 pb-2 pt-1 text-xs font-medium text-zvv-muted lg:block">{roleLabel}</p>
          ) : null}
          <p className="px-3 pb-2 pt-1 text-sm font-semibold text-zvv-ink">{BEHEER_NAV_GROUP_LABELS.primary}</p>
          <nav className="flex flex-col gap-1" aria-label="Beheer navigatie">
            {primary.map((item) => {
              const active = isBeheerNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={withSeason(item.href, seasonId)}
                  onClick={() => setNavOpen(false)}
                  className={navLinkClass(active)}
                >
                  <span className="mr-2 opacity-80" aria-hidden>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {showOps ? (
            <>
              <p className="mt-5 px-3 pb-2 pt-1 text-sm font-semibold text-zvv-ink">{BEHEER_NAV_GROUP_LABELS.ops}</p>
              <nav className="flex flex-col gap-1" aria-label="Datacontrole">
                {BEHEER_OPS_NAV.map((item) => {
                  const active = isBeheerNavActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={withSeason(item.href, seasonId)}
                      onClick={() => setNavOpen(false)}
                      className={navLinkClass(active)}
                    >
                      <span className="mr-2 opacity-80" aria-hidden>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </>
          ) : null}
        </aside>

        <div className="min-w-0 pb-10">{children}</div>
      </div>
    </div>
  );
}
