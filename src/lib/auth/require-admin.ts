import { redirect } from "next/navigation";
import {
  assertCapability,
  resolveAuthContext,
  roleHasCapability,
  type Capability,
} from "@/lib/auth/capabilities";

type RequireAccessOptions = {
  loginRedirect?: string;
  forbiddenRedirect?: string;
  /** Default: access_beheer (owner + teambeheer). */
  capability?: Capability;
};

/**
 * Server-side layout/pages: owner of teambeheer met voldoende capability.
 */
export async function requireAdmin(options?: RequireAccessOptions): Promise<{ userId: string }> {
  const cap = options?.capability ?? "access_beheer";
  const ctx = await resolveAuthContext();

  if (!ctx) {
    redirect(options?.loginRedirect ?? "/login");
  }

  if (!roleHasCapability(ctx.role, cap)) {
    redirect(options?.forbiddenRedirect ?? "/");
  }

  return { userId: ctx.userId };
}

/**
 * Server actions: teamwrites (default manage_squad).
 * Voor systeemacties: assertSystemAdminAction / assertCapability("system_admin").
 */
export async function assertAdminServerAction(): Promise<{ userId: string }> {
  return assertCapability("manage_squad");
}

export async function assertTeamWrite(cap: Capability): Promise<{ userId: string }> {
  return assertCapability(cap);
}

export async function assertSystemAdminAction(): Promise<{ userId: string }> {
  return assertCapability("system_admin");
}
