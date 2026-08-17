/**
 * Countdown + 6-week fitness expectation tests.
 * Run: npx tsx src/lib/operations/countdown.test.ts
 */
import assert from "node:assert/strict";
import {
  computeCountdown,
  expectedFitnessTestDate,
  countdownRefreshIntervalMs,
} from "@/lib/operations/countdown";

const base = new Date("2026-07-30T10:00:00");

{
  const r = computeCountdown(null, base);
  assert.equal(r.state, "missing");
}

{
  const r = computeCountdown("2026-09-10", base);
  assert.equal(r.state, "future");
  assert.match(r.primaryLabel, /wek/i);
}

{
  const r = computeCountdown("2026-08-02T15:00:00", base);
  assert.equal(r.state, "future");
  assert.match(r.primaryLabel, /Over 3 dagen|dagen/);
}

{
  const r = computeCountdown("2026-07-31T19:30:00", base);
  assert.equal(r.state, "tomorrow");
  assert.match(r.primaryLabel, /Morgen/);
}

{
  const r = computeCountdown("2026-07-30T19:30:00", base);
  assert.equal(r.state, "today");
  assert.match(r.primaryLabel, /Vandaag/);
}

{
  const soon = new Date(base.getTime() + 45 * 60_000).toISOString();
  const r = computeCountdown(soon, base);
  assert.equal(r.state, "soon");
  assert.match(r.primaryLabel, /Begint over/);
}

{
  const liveStart = new Date(base.getTime() - 30 * 60_000).toISOString();
  const r = computeCountdown(liveStart, base, { durationMs: 2 * 60 * 60_000 });
  assert.equal(r.state, "live");
}

{
  const past = new Date(base.getTime() - 3 * 60 * 60_000).toISOString();
  const r = computeCountdown(past, base, { durationMs: 2 * 60 * 60_000 });
  assert.equal(r.state, "past");
  assert.equal(r.urgency, "overdue");
}

{
  assert.equal(expectedFitnessTestDate("2026-08-30"), "2026-10-11");
  const overdue = computeCountdown("2026-07-27", base, { expectedLabel: true });
  assert.equal(overdue.state, "past");
  assert.equal(overdue.urgency, "overdue");
}

{
  const far = countdownRefreshIntervalMs("2026-10-01", base);
  assert.equal(far, null);
  const near = countdownRefreshIntervalMs(new Date(base.getTime() + 30 * 60_000).toISOString(), base);
  assert.equal(near, 60_000);
}

console.log("countdown.test.ts: ok");
