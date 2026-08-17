import { CONNECTED_TEAM_CANONICAL } from "@/lib/academie/tactical-authored-connected-team";
import {
  teamSpacingMeters,
  lineGapsMeters,
  distanceMeters,
  US_OUTFIELD,
  US_ATTACK_FIVE,
  US_DEF_FRONT,
  US_DEF_MID,
  US_DEF_BACK,
  US_REST_THREE,
  OPP_OUTFIELD,
  OPP_FRONT,
  OPP_MID,
  OPP_BACK,
} from "@/lib/academie/tactical-pitch-meters";

function pts(shape: Record<string, { at: { x: number; y: number } }>) {
  const o: Record<string, { x: number; y: number }> = {};
  for (const [k, v] of Object.entries(shape)) o[k] = v.at;
  return o;
}

for (const key of ["A1", "A2", "A3"] as const) {
  const c = CONNECTED_TEAM_CANONICAL[key];
  const us = pts(c.usShape);
  const opp = pts(c.opponentShape);
  console.log("===", key, "===");
  console.log("us", teamSpacingMeters(us, [...US_OUTFIELD]));
  if (key === "A1") {
    console.log(
      "five y",
      US_ATTACK_FIVE.map((id) => `${id}:${us[id]!.y}`),
    );
    console.log("rest three", teamSpacingMeters(us, [...US_REST_THREE]));
    console.log("6-LCB m", distanceMeters(us["us.L6"]!, us["us.LCV"]!).toFixed(1));
    console.log("8 above 6 m", ((us["us.R6"]!.x - us["us.L6"]!.x) * 1.05).toFixed(1));
    console.log("8-RW m", distanceMeters(us["us.R6"]!, us["us.RW"]!).toFixed(1));
    console.log("RB-RW m", distanceMeters(us["us.RB"]!, us["us.RW"]!).toFixed(1));
    console.log("opp", teamSpacingMeters(opp, [...OPP_OUTFIELD]));
    console.log("opp gaps", lineGapsMeters(opp, [[...OPP_FRONT], [...OPP_MID], [...OPP_BACK]]));
  }
  if (key === "A3") {
    console.log("us gaps", lineGapsMeters(us, [[...US_DEF_FRONT], [...US_DEF_MID], [...US_DEF_BACK]]));
    console.log("6-8 m", distanceMeters(us["us.L6"]!, us["us.R6"]!).toFixed(1));
    console.log("ST-10 m", distanceMeters(us["us.SP"]!, us["us.10"]!).toFixed(1));
    console.log("opp", teamSpacingMeters(opp, [...OPP_OUTFIELD]));
  }
}
