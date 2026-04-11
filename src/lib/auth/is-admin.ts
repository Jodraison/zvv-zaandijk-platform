/**
 * Single source of truth for admin access: alleen deze e-mail, geen `user_metadata.role`.
 */
export const ADMIN_EMAIL = "jodraison@hotmail.com";

export function isAdmin(user: { email?: string | null } | null | undefined): boolean {
  return user?.email?.toLowerCase() === ADMIN_EMAIL;
}
