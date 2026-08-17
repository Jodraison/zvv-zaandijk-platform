/**
 * Fitness Control Center 2.0 — parse + completeness tests.
 * Run: npx tsx src/lib/fitness/fitness-protocol.test.ts
 */
import assert from "node:assert/strict";
import {
  parseMetersValue,
  parsePlankToSeconds,
  parseSecondsValue,
  formatPlankDisplay,
  formatSecondsNl,
  formatMetersNl,
} from "@/lib/fitness/parse-values";
import {
  derivePlayerCompleteness,
  deriveParticipationStatus,
  sessionProgress,
  countFilledComponents,
} from "@/lib/fitness/completeness";
import { assertNoTotalTime, FITNESS_COMPONENTS } from "@/lib/fitness/protocol";

assert.equal(FITNESS_COMPONENTS.length, 4);
assert.ok(!FITNESS_COMPONENTS.some((c) => (c as { key: string }).key.includes("total")));

// Sprint decimal
{
  const a = parseSecondsValue("4,82");
  assert.equal(a.ok && a.value, 4.82);
  const b = parseSecondsValue("4.82");
  assert.equal(b.ok && b.value, 4.82);
  const empty = parseSecondsValue("");
  assert.equal(empty.ok && empty.value, null);
  const zero = parseSecondsValue("0");
  assert.equal(zero.ok, false);
}

// Agility
{
  const a = parseSecondsValue("17,42");
  assert.equal(a.ok && a.value, 17.42);
}

// Plank 1:45 → 105; 105 → 105
{
  const a = parsePlankToSeconds("1:45");
  assert.equal(a.ok && a.value, 105);
  const b = parsePlankToSeconds("105");
  assert.equal(b.ok && b.value, 105);
  assert.equal(formatPlankDisplay(105), "1:45");
  const zero = parsePlankToSeconds("0");
  assert.equal(zero.ok, false);
  const empty = parsePlankToSeconds("");
  assert.equal(empty.ok && empty.value, null);
}

// Meters integer
{
  const a = parseMetersValue("1345");
  assert.equal(a.ok && a.value, 1345);
  const b = parseMetersValue("1.345");
  assert.equal(b.ok && b.value, 1345);
  const dec = parseMetersValue("12.5");
  assert.equal(dec.ok, false);
  const zero = parseMetersValue("0");
  assert.equal(zero.ok, false);
}

// Completeness
{
  const partial = {
    flying_sprint_30m_seconds: 4.8,
    agility_10_20_10_seconds: null,
    plank_seconds: null,
    six_minute_run_meters: null,
  };
  assert.equal(countFilledComponents(partial), 1);
  assert.equal(derivePlayerCompleteness(partial), "partial");
  assert.equal(deriveParticipationStatus(partial), "partial");

  const full = {
    flying_sprint_30m_seconds: 4.8,
    agility_10_20_10_seconds: 17.4,
    plank_seconds: 105,
    six_minute_run_meters: 1345,
  };
  assert.equal(derivePlayerCompleteness(full), "complete");

  const absent = { ...partial, flying_sprint_30m_seconds: null, participation_status: "absent" as const };
  assert.equal(derivePlayerCompleteness(absent), "absent");
}

// Progress
{
  const prog = sessionProgress(
    [
      {
        flying_sprint_30m_seconds: 4.8,
        agility_10_20_10_seconds: 17,
        plank_seconds: 100,
        six_minute_run_meters: 1200,
      },
      {
        flying_sprint_30m_seconds: 5,
        agility_10_20_10_seconds: null,
        plank_seconds: null,
        six_minute_run_meters: null,
      },
    ],
    16,
  );
  assert.equal(prog.complete, 1);
  assert.equal(prog.partial, 1);
  assert.equal(prog.byComponent.flying_sprint_30m_seconds, 2);
  assert.equal(prog.expectedPlayers, 16);
}

// No totalTime
{
  assert.throws(() => assertNoTotalTime({ totalTime: 10 }));
  assert.throws(() => assertNoTotalTime({ total_time: 10 }));
  assertNoTotalTime({ flying_sprint_30m_seconds: 4.8 });
}

assert.equal(formatSecondsNl(4.82), "4,82 s");
assert.equal(formatMetersNl(1345), "1.345 m");

console.log("fitness-protocol.test.ts: ok");
