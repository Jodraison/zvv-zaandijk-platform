/**
 * Training attendance production recovery — sid/season/save/historie.
 * Run: npx tsx src/lib/training/training-attendance-recovery.test.ts
 */
import assert from "node:assert/strict";
import { SEASON_2026_27_ID, clubLocalDateTimeToIso } from "@/lib/season/season-operations-2026-27";
import { classifyTrainingSessions } from "@/lib/training/manual-training";
import {
  isTrainingSessionId,
  resolveSessionForAttendanceSave,
  resolveTrainingWorkspaceSelection,
  trainingAttendanceIsReadOnly,
} from "@/lib/training/training-attendance-workspace";
import { assertCanPersistCompletedAttendance } from "@/lib/training/training-status";
import type { TrainingSession } from "@/types";

const SID = "435d378b-de48-4b2b-81ea-74d2ede40950";
const OTHER = "1a2e8c35-586b-47a7-b049-079fbfb63fe9";

const aug17: TrainingSession = {
  id: SID,
  season_id: SEASON_2026_27_ID,
  title: "Training",
  session_at: "2026-08-17T18:00:00.000Z",
  location: null,
  status: "scheduled",
};

const extraSameWeek: TrainingSession = {
  id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
  season_id: SEASON_2026_27_ID,
  title: "Extra training",
  session_at: clubLocalDateTimeToIso("2026-08-18", "19:30"),
  location: "19:30–20:45",
  status: "scheduled",
};

const otherSeason: TrainingSession = {
  id: OTHER,
  season_id: "other-season",
  title: "Training",
  session_at: "2026-08-10T18:00:00.000Z",
  location: "20:00–21:00",
  status: "completed",
};

assert.equal(isTrainingSessionId(SID), true);
assert.equal(isTrainingSessionId("nope"), false);

{
  const hit = resolveTrainingWorkspaceSelection({
    sid: SID,
    sessions: [aug17, extraSameWeek],
  });
  assert.equal(hit.sessionId, SID);
  assert.equal(hit.missingSid, false);
}

{
  const miss = resolveTrainingWorkspaceSelection({
    sid: SID,
    sessions: [extraSameWeek],
  });
  assert.equal(miss.sessionId, "");
  assert.equal(miss.missingSid, true);
}

{
  const seasonOk = resolveTrainingWorkspaceSelection({
    sid: null,
    dateKey: "2026-08-17",
    sessions: [aug17, extraSameWeek],
    dateKeys: [
      { id: extraSameWeek.id, dateKey: "2026-08-18" },
      { id: aug17.id, dateKey: "2026-08-17" },
    ],
  });
  assert.equal(seasonOk.sessionId, SID);
}

{
  const bySid = resolveSessionForAttendanceSave([aug17, extraSameWeek], SEASON_2026_27_ID, "2026-08-18", SID);
  assert.equal(bySid?.id, SID);
  const missing = resolveSessionForAttendanceSave([aug17], SEASON_2026_27_ID, "2026-08-17", OTHER);
  assert.equal(missing, null);
  const byDate = resolveSessionForAttendanceSave([aug17, extraSameWeek], SEASON_2026_27_ID, "2026-08-18");
  assert.equal(byDate?.id, extraSameWeek.id);
  const wrongSeason = resolveSessionForAttendanceSave([otherSeason], SEASON_2026_27_ID, "2026-08-10", OTHER);
  assert.equal(wrongSeason, null);
}

{
  const now = new Date("2026-08-21T12:00:00+02:00");
  assert.equal(assertCanPersistCompletedAttendance(aug17.session_at, now).ok, true);
  assert.equal(trainingAttendanceIsReadOnly(aug17.status), false);
  assert.equal(trainingAttendanceIsReadOnly("completed"), false);
  assert.equal(trainingAttendanceIsReadOnly("cancelled"), true);
  const items = classifyTrainingSessions([aug17, extraSameWeek], [], 21, now);
  assert.equal(items.find((i) => i.session.id === SID)?.needsAttendance, true);
  assert.equal(items.find((i) => i.session.id === extraSameWeek.id)?.needsAttendance, true);
}

{
  const first = [
    { session_id: SID, player_id: "p1", present: false },
    { session_id: SID, player_id: "p2", present: true },
    { session_id: SID, player_id: "p3", present: true },
  ];
  const updated = first.map((r) => (r.player_id === "p1" ? { ...r, present: true } : r));
  assert.equal(updated.filter((r) => r.present).length, 3);
  const keys = updated.map((r) => `${r.session_id}:${r.player_id}`);
  assert.equal(new Set(keys).size, keys.length);
}

console.log("PASS test:training-attendance-recovery");
