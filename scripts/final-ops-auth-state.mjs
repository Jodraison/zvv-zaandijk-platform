/**
 * Create Playwright storage state for admin via service-role OTP + cookie injection.
 * Never prints tokens.
 *
 * Run: node --env-file=.env.local scripts/final-ops-auth-state.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const ADMIN_EMAIL = "jodraison@hotmail.com";
const PROJECT_REF = "othxhnkwkygggkktvosp";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !service || !anon) {
  console.error("Missing Supabase env");
  process.exit(1);
}
if (!url.includes(PROJECT_REF)) {
  console.error("Refusing auth helper: not ZVV project");
  process.exit(1);
}

const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
const userClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
  type: "magiclink",
  email: ADMIN_EMAIL,
});
if (linkErr) {
  console.error("generateLink failed");
  process.exit(1);
}
const otp = link?.properties?.email_otp;
if (!otp) {
  console.error("No email_otp from generateLink");
  process.exit(1);
}

const { data: verified, error: verErr } = await userClient.auth.verifyOtp({
  email: ADMIN_EMAIL,
  token: otp,
  type: "email",
});
if (verErr || !verified.session) {
  console.error("verifyOtp failed");
  process.exit(1);
}

const session = verified.session;
mkdirSync(".review-auth", { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();

// @supabase/ssr browser client stores session in cookie `sb-<ref>-auth-token`
const cookieName = `sb-${PROJECT_REF}-auth-token`;
const cookiePayload = {
  access_token: session.access_token,
  refresh_token: session.refresh_token,
  expires_at: session.expires_at,
  expires_in: session.expires_in,
  token_type: session.token_type ?? "bearer",
  user: session.user,
};

await context.addCookies([
  {
    name: cookieName,
    value: encodeURIComponent(JSON.stringify(cookiePayload)),
    domain: "localhost",
    path: "/",
    httpOnly: false,
    secure: false,
    sameSite: "Lax",
  },
]);

const page = await context.newPage();
// Also set via in-page supabase client for chunked cookie formats
await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.evaluate(
  async ({ access_token, refresh_token }) => {
    const mod = await import("/_next/static/chunks/noop.js").catch(() => null);
    void mod;
    // Use global fetch to call setSession through a tiny inline supabase from window if present
    const keys = Object.keys(localStorage);
    for (const k of keys) {
      if (k.includes("auth-token")) localStorage.removeItem(k);
    }
    // Direct localStorage fallback some clients still read
    localStorage.setItem(
      "sb-othxhnkwkygggkktvosp-auth-token",
      JSON.stringify({ access_token, refresh_token, expires_at: Math.floor(Date.now() / 1000) + 3600 }),
    );
  },
  { access_token: session.access_token, refresh_token: session.refresh_token },
);

await page.goto("http://localhost:3000/beheer", { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(1200);
const pathOnly = new URL(page.url()).pathname;
const body = await page.locator("body").innerText();
const ok = pathOnly.startsWith("/beheer") && !/Beheerderslogin|Inloggen/.test(body.slice(0, 400));

await context.storageState({ path: ".review-auth/admin-storage.json" });
await browser.close();

if (!ok) {
  console.error("Auth failed to open /beheer (path=", pathOnly, ")");
  process.exit(1);
}
console.log("auth storage written");
