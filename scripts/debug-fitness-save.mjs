import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const SESSION = "a0000001-0000-4000-8000-0000000000c3";
const SEASON = "c0ffee00-0002-4000-8000-000000000001";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: ".review-auth/admin-storage.json" });
const page = await context.newPage();

const responses = [];
page.on("response", async (res) => {
  if (res.url().includes("fitness") || res.request().method() === "POST") {
    responses.push({ status: res.status(), url: res.url().slice(0, 120), method: res.request().method() });
  }
});

await page.goto(`http://localhost:3000/beheer/fitheid/${SESSION}/station/sprint?season=${SEASON}`, {
  waitUntil: "networkidle",
  timeout: 90000,
});
await page.waitForTimeout(800);
const inputs = page.locator("ul input[inputmode='decimal']:not([disabled])");
console.log("inputs", await inputs.count());
await inputs.nth(0).click({ force: true });
await inputs.nth(0).fill("4,91");
await inputs.nth(0).press("Tab");
await page.getByRole("button", { name: /Concept opslaan/i }).click();
await page.waitForTimeout(5000);
const body = await page.locator("body").innerText();
console.log("saveHint", body.match(/Opgeslagen[^\n]*|Opslaan mislukt[^\n]*|Fout[^\n]*|niet gevonden[^\n]*|rechten[^\n]*|migratie[^\n]*/i)?.[0] ?? "none");
console.log("posts", responses.filter((r) => r.method === "POST").slice(-5));
await browser.close();

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const { data } = await sb
  .from("fitness_test_results")
  .select("flying_sprint_30m_seconds")
  .eq("session_id", SESSION)
  .not("flying_sprint_30m_seconds", "is", null);
console.log("dbFilled", data?.length ?? 0);
