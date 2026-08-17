/**
 * Tactical Visual System V2 — design validation (dev).
 * Run: npx tsx src/lib/academie/tactical-visual-v2-validate.ts
 */
import { listAnimatedSituationIds } from "@/lib/academie/tactical-animation-registry";
import { getTacticalSituation } from "@/components/academie/tactical-situations";
import { TACTICAL_COLORS, TACTICAL_MOTION, TACTICAL_PLAYER_STYLES } from "@/lib/academie/tactical-visual-tokens";

type Issue = { level: "error" | "warn"; code: string; message: string };

const issues: Issue[] = [];

function checkContrastBasics() {
  if (!TACTICAL_COLORS.us || !TACTICAL_COLORS.opponent) {
    issues.push({ level: "error", code: "missing-team-colors", message: "Team colors missing" });
  }
  if (TACTICAL_PLAYER_STYLES.radius > 18) {
    issues.push({ level: "warn", code: "marker-too-large", message: `radius ${TACTICAL_PLAYER_STYLES.radius}` });
  }
  if (TACTICAL_MOTION.maxZoom > 0.2) {
    issues.push({ level: "error", code: "zoom-too-high", message: `maxZoom ${TACTICAL_MOTION.maxZoom}` });
  }
}

function checkSituationVisualNoise(id: string) {
  const sit = getTacticalSituation(id);
  if (!sit) return;
  if ((sit.lines?.length ?? 0) > 10) {
    issues.push({
      level: "warn",
      code: "too-many-lines",
      message: `${id}: ${sit.lines?.length} static lines (renderer caps at 8)`,
    });
  }
  if ((sit.zones?.length ?? 0) > 4) {
    issues.push({
      level: "warn",
      code: "too-many-zones",
      message: `${id}: ${sit.zones?.length} zones`,
    });
  }
  for (const p of sit.players) {
    if (p.label.length > 3) {
      issues.push({
        level: "warn",
        code: "long-label",
        message: `${id}: ${p.id} label "${p.label}"`,
      });
    }
  }
}

checkContrastBasics();
const ids = listAnimatedSituationIds();
for (const id of ids) checkSituationVisualNoise(id);

const errors = issues.filter((i) => i.level === "error");
const warns = issues.filter((i) => i.level === "warn");
console.log("visualV2 situations", ids.length);
console.log("errors", errors.length);
console.log("warns", warns.length);
for (const e of errors) console.log("ERR", e.code, e.message);
for (const w of warns.slice(0, 25)) console.log("WARN", w.code, w.message);
if (errors.length) process.exitCode = 1;
else console.log("tactical-visual-v2-validate: ok");
