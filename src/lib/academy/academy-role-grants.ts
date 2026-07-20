import { isAdmin } from "@/lib/auth/is-admin";

/**
 * Academy role grants for RoleMenu (T-01-04 / C-A04).
 * Uses existing platform roles only — no new team-role tables.
 * Until speelster/captain/trainer grants exist in DB, admin e-mail unlocks
 * Captain + Trainer; everyone else sees those entries disabled.
 */
export type AcademyRoleGrants = {
  displayName: string;
  /** Always true for authenticated Academy users (default context). */
  canSpeelster: boolean;
  canCaptain: boolean;
  canTrainer: boolean;
  canAdmin: boolean;
};

export function resolveAcademyRoleGrants(input: {
  email?: string | null;
  displayName?: string | null;
}): AcademyRoleGrants {
  const admin = isAdmin(input);
  const label =
    (typeof input.displayName === "string" && input.displayName.trim()) ||
    (typeof input.email === "string" && input.email.trim()) ||
    "Profiel";

  return {
    displayName: label,
    canSpeelster: true,
    canCaptain: admin,
    canTrainer: admin,
    canAdmin: admin,
  };
}

export const ACADEMY_CAPTAIN_LOCKED_HINT =
  "Alleen beschikbaar met captain-toegang. Vraag je trainer of clubbeheerder.";

export const ACADEMY_TRAINER_LOCKED_HINT =
  "Alleen beschikbaar met trainer-toegang. Vraag je clubbeheerder.";
