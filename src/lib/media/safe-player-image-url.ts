/**
 * Alleen URL’s die veilig in `next/image` mogen (remotePatterns + lokale paden).
 * Blokkeert file://, blob:, data:, en niet-Supabase remote hosts.
 */
export function isSafePlayerImageUrl(url: string | null | undefined): boolean {
  const t = url?.trim();
  if (!t || t.length > 2048) return false;

  const lower = t.toLowerCase();
  if (
    lower.startsWith("file:") ||
    lower.startsWith("blob:") ||
    lower.startsWith("data:") ||
    lower.startsWith("javascript:") ||
    lower.startsWith("vbscript:")
  ) {
    return false;
  }

  // Statische assets onder /public (één leading slash, geen protocol-relative //)
  if (t.startsWith("/") && !t.startsWith("//")) {
    if (t.includes("..") || /\s/.test(t)) return false;
    return /^\/[\w./~-]+$/.test(t);
  }

  if (!/^https?:\/\//i.test(t)) return false;

  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    if (!host) return false;
    return host === "supabase.co" || host.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

/** Voor opslag: leeg of ongeldig → null, anders getrimde veilige URL. */
export function normalizePlayerPhotoUrlForStorage(raw: string | null | undefined): string | null {
  const t = raw?.trim() ?? "";
  if (!t) return null;
  return isSafePlayerImageUrl(t) ? t : null;
}
