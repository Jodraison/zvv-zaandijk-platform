import {
  CONNECTED_TEAM_AUTHORED,
  CONNECTED_TEAM_RECOVERY,
} from "@/lib/academie/tactical-authored-connected-team";
import {
  teamSpacingMeters,
  lineGapsMeters,
  US_OUTFIELD,
  OPP_OUTFIELD,
  US_ATTACK_FIVE,
  US_DEF_FRONT,
  US_DEF_MID,
  US_DEF_BACK,
  OPP_FRONT,
  OPP_MID,
  OPP_BACK,
} from "@/lib/academie/tactical-pitch-meters";

function pts(shape: Record<string, { at: { x: number; y: number } }>) {
  const o: Record<string, { x: number; y: number }> = {};
  for (const [k, v] of Object.entries(shape)) o[k] = v.at;
  return o;
}

const start = CONNECTED_TEAM_AUTHORED.phases[0]!;
const end = CONNECTED_TEAM_AUTHORED.phases[6]!;
const loss = CONNECTED_TEAM_RECOVERY["loss-d"];

console.log("START us", teamSpacingMeters(pts(start.usShape), [...US_OUTFIELD]));
console.log("START opp", teamSpacingMeters(pts(start.opponentShape), [...OPP_OUTFIELD]));
console.log("START opp gaps", lineGapsMeters(pts(start.opponentShape), [[...OPP_FRONT], [...OPP_MID], [...OPP_BACK]]));
console.log("END us", teamSpacingMeters(pts(end.usShape), [...US_OUTFIELD]));
console.log("END five y", US_ATTACK_FIVE.map((id) => `${id}:${end.usShape[id]!.at.y}`));
console.log("LOSS us", teamSpacingMeters(pts(loss.usShape), [...US_OUTFIELD]));
console.log("LOSS gaps", lineGapsMeters(pts(loss.usShape), [[...US_DEF_FRONT], [...US_DEF_MID], [...US_DEF_BACK]]));
