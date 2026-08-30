/**
 * Refresh Playwright admin storage against the isolated 3013 server.
 * Never prints tokens.
 */
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { chromium } from "playwright";

const ADMIN_EMAIL = "jodraison@hotmail.com";
const PROJECT_REF = "othxhnkwkygggkktvosp";
const BASE = "http://localhost:3013";

for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url?.includes(PROJECT_REF) || !service || !anon) {
  console.error("Missing or wrong Supabase env");
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
  console.error("No email_otp");
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

const browser = await chromium.launch({ headless: true, channel: "msedge" }).catch(() =>
  chromium.launch({ headless: true }),
);
const context = await browser.newContext();
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
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.evaluate(
  ({ access_token, refresh_token }) => {
    localStorage.setItem(
      "sb-othxhnkwkygggkktvosp-auth-token",
      JSON.stringify({ access_token, refresh_token, expires_at: Math.floor(Date.now() / 1000) + 3600 }),
    );
  },
  { access_token: session.access_token, refresh_token: session.refresh_token },
);

await page.goto(`${BASE}/beheer/wedstrijden`, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(800);
const pathOnly = new URL(page.url()).pathname;
const body = await page.locator("body").innerText();
const ok = pathOnly.startsWith("/beheer") && !/Beheerderslogin|Inloggen/.test(body.slice(0, 400));
await context.storageState({ path: ".review-auth/admin-storage.json" });
await browser.close();
if (!ok) {
  console.error("Auth failed path=", pathOnly);
  process.exit(1);
}
console.log("auth storage written for 3013");
