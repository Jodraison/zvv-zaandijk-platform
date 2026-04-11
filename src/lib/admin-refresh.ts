"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
 * Na geslaagde admin-mutatie: RSC-verversing. Optioneel volledige pagina-reload
 * als `NEXT_PUBLIC_ADMIN_FULL_RELOAD=true` (multi-tab / hardnekkige cache).
 */
export function refreshAfterAdminSave(router: AppRouterInstance): void {
  router.refresh();
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_ADMIN_FULL_RELOAD === "true") {
    window.location.reload();
  }
}
