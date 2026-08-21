/**
 * Capability-laag voor Football Operations.
 * Owner (vaste admin-e-mail) = alles.
 * team_manager / captain (profiles.role) = teamtaken, geen systeembeheer.
 */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdmin, ADMIN_EMAIL } from "@/lib/auth/is-admin";

export type AppRole = "owner" | "team_manager" | "none";

export type Capability =
  | "access_beheer"
  | "manage_squad"
  | "manage_training"
  | "manage_fitness"
  | "manage_match_results"
  | "view_audit"
  | "manage_seasons"
  | "system_admin";

const TEAM_MANAGER_CAPS: readonly Capability[] = [
  "access_beheer",
  "manage_squad",
  "manage_training",
  "manage_fitness",
  "manage_match_results",
];

const OWNER_CAPS: readonly Capability[] = [
  ...TEAM_MANAGER_CAPS,
  "view_audit",
  "manage_seasons",
  "system_admin",
];

/** Optionele env-allowlist voor gedelegeerde teambeheerders (komma-gescheiden e-mails). */
function teamManagerEmailsFromEnv(): Set<string> {
  const raw = process.env.TEAM_MANAGER_EMAILS ?? process.env.ZVV_TEAM_MANAGER_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function roleFromProfileRole(profileRole: string | null | undefined, email: string | null | undefined): AppRole {
  if (isAdmin({ email })) return "owner";
  const e = (email ?? "").toLowerCase();
  if (e && teamManagerEmailsFromEnv().has(e)) return "team_manager";
  const r = (profileRole ?? "").toLowerCase();
  if (r === "team_manager" || r === "captain" || r === "coach") return "team_manager";
  return "none";
}

export function capabilitiesForRole(role: AppRole): readonly Capability[] {
  if (role === "owner") return OWNER_CAPS;
  if (role === "team_manager") return TEAM_MANAGER_CAPS;
  return [];
}

export function roleHasCapability(role: AppRole, cap: Capability): boolean {
  return capabilitiesForRole(role).includes(cap);
}

/** Individuele afwezigheidsredenen: alleen wie training mag beheren. */
export function canViewPlayerAbsenceReasons(role: AppRole | null | undefined): boolean {
  return role != null && roleHasCapability(role, "manage_training");
}

export type AuthContext = {
  userId: string;
  email: string | null;
  role: AppRole;
  capabilities: readonly Capability[];
};

export async function resolveAuthContext(): Promise<AuthContext | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  let profileRole: string | null = null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  profileRole = (profile?.role as string | undefined) ?? null;

  const role = roleFromProfileRole(profileRole, user.email);
  return {
    userId: user.id,
    email: user.email ?? null,
    role,
    capabilities: capabilitiesForRole(role),
  };
}

export async function assertCapability(cap: Capability): Promise<{ userId: string; role: AppRole }> {
  const ctx = await resolveAuthContext();
  if (!ctx || !roleHasCapability(ctx.role, cap)) {
    throw new Error("UNAUTHORIZED");
  }
  return { userId: ctx.userId, role: ctx.role };
}

/** Menselijke rolnaam voor UI. */
export function roleLabelNl(role: AppRole): string {
  if (role === "owner") return "Hoofdbeheer";
  if (role === "team_manager") return "Teambeheer";
  return "Geen toegang";
}

export { ADMIN_EMAIL };
