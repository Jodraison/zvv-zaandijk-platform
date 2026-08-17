"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { AcademyRoleBadge } from "@/components/academy/academy-role-badge";
import {
  ACADEMY_CAPTAIN_LOCKED_HINT,
  ACADEMY_TRAINER_LOCKED_HINT,
  type AcademyRoleGrants,
} from "@/lib/academy/academy-role-grants";
import { academyRoutes } from "@/lib/academy/routes";
import { cn } from "@/lib/utils";

/**
 * C-A04 RoleMenu — rol-switch · settings stub · logout (T-01-04).
 * Captain/Trainer links enabled only when grants allow.
 */
export function AcademyRoleMenu({ grants }: { grants: AcademyRoleGrants }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef} data-academy-component="C-A04">
      <button
        type="button"
        className={cn(
          "inline-flex min-h-11 max-w-[10rem] items-center gap-1.5 truncate rounded-lg border border-zvv-border",
          "bg-white px-3 text-sm font-semibold text-zvv-ink hover:border-zvv-primary",
        )}
        aria-label="Profiel en rol"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate">{grants.displayName}</span>
        {grants.canAdmin ? <AcademyRoleBadge label="Admin" tone="active" /> : null}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Rol en account"
          className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-zvv-border bg-white p-2 shadow-lg"
        >
          <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-zvv-muted">
            Rollen
          </p>

          <RoleLink
            href={academyRoutes.positie}
            label="Speelster"
            badge="Speelster"
            enabled
            onNavigate={() => setOpen(false)}
          />

          <RoleLink
            href={academyRoutes.teamCaptain}
            label="Aanvoerder"
            badge="Aanvoerder"
            enabled={grants.canCaptain}
            lockedHint={ACADEMY_CAPTAIN_LOCKED_HINT}
            onNavigate={() => setOpen(false)}
          />

          <RoleLink
            href={academyRoutes.teamTrainer}
            label="Trainer"
            badge="Trainer"
            enabled={grants.canTrainer}
            lockedHint={ACADEMY_TRAINER_LOCKED_HINT}
            onNavigate={() => setOpen(false)}
          />

          <div className="my-2 border-t border-zvv-border" />

          <button
            type="button"
            role="menuitem"
            disabled
            className="flex w-full cursor-not-allowed items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-zvv-muted"
            title="Instellingen volgen later"
          >
            Instellingen
            <span className="text-xs">stub</span>
          </button>

          <form action="/auth/signout" method="post" role="none">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-zvv-ink hover:bg-zvv-surface"
            >
              Uitloggen
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function RoleLink({
  href,
  label,
  badge,
  enabled,
  lockedHint,
  onNavigate,
}: {
  href: string;
  label: string;
  badge: string;
  enabled: boolean;
  lockedHint?: string;
  onNavigate: () => void;
}) {
  if (!enabled) {
    return (
      <div
        role="menuitem"
        aria-disabled="true"
        className="flex flex-col gap-0.5 rounded-lg px-3 py-2.5 opacity-70"
        title={lockedHint}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-zvv-muted">{label}</span>
          <AcademyRoleBadge label={badge} tone="locked" />
        </div>
        {lockedHint ? (
          <p className="text-xs leading-snug text-zvv-muted" data-academy-locked-hint>
            {lockedHint}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-zvv-ink hover:bg-zvv-surface"
      onClick={onNavigate}
    >
      {label}
      <AcademyRoleBadge label={badge} tone="active" />
    </Link>
  );
}
