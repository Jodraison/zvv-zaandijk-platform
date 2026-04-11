/** Types + client-safe defaults for wedstrijd-beheer (niet in `use server` bundel exporteren als actie). */

import type { MatchVerificationPayload } from "@/lib/admin/verification-types";

export type MatchAdminActionResult =
  | { ok: true; matchId: string; verification?: MatchVerificationPayload }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export type MatchAdminFormState =
  | { status: "idle" }
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> }
  | { status: "success"; message: string; matchId?: string; deleted?: boolean; verification?: MatchVerificationPayload };

export const initialMatchAdminFormState: MatchAdminFormState = { status: "idle" };
