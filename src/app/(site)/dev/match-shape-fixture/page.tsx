import { notFound } from "next/navigation";
import { FormationPitch } from "@/components/match/formation-pitch";
import { emptyFormationMap, type FormationSlotCode } from "@/lib/match/formation-4231";
import { getMatchShapeAtMinute } from "@/lib/match/match-shape";
import type { ClubDatabase, MatchLineupEntry, MatchPositionChange, MatchSubstitution } from "@/types";

/**
 * Test-only reconstructie van een complexe wedstrijd.
 * Geen databasewrites · niet bereikbaar in productie.
 */
export default function MatchShapeFixturePage() {
  if (process.env.NODE_ENV === "production") notFound();

  const matchId = "fixture-match";
  const ids = {
    gk: "p-gk",
    lb: "p-lb",
    lcb: "p-lcb",
    rcb: "p-rcb",
    rb: "p-rb",
    lcvm: "p-lcvm",
    rcvm: "p-rcvm",
    lm: "p-lm",
    cam: "p-cam",
    rm: "p-rm",
    sp: "p-sp",
    bench1: "p-bench1",
  };

  const startSlots: Record<FormationSlotCode, string> = {
    GK: ids.gk,
    LB: ids.lb,
    LCB: ids.lcb,
    RCB: ids.rcb,
    RB: ids.rb,
    LCVM: ids.lcvm,
    RCVM: ids.rcvm,
    LM: ids.lm,
    CAM: ids.cam,
    RM: ids.rm,
    SP: ids.sp,
  };

  const lineup: MatchLineupEntry[] = Object.entries(startSlots).map(([position, player_id], i) => ({
    id: `l-${i}`,
    match_id: matchId,
    player_id,
    role: "starter",
    position,
    absence_reason: null,
    sort_order: i,
  }));
  lineup.push({
    id: "l-bench",
    match_id: matchId,
    player_id: ids.bench1,
    role: "bench",
    position: null,
    absence_reason: null,
    sort_order: 20,
  });

  const group = "group-1";
  const subs: MatchSubstitution[] = [
    {
      id: "sub-1",
      match_id: matchId,
      player_out_id: ids.sp,
      player_in_id: ids.bench1,
      minute: 58,
      to_slot: "SP",
      stoppage_time: 0,
      sort_order: 0,
      change_group_id: group,
      notes: null,
    },
  ];
  const pos: MatchPositionChange[] = [
    {
      id: "pos-1",
      match_id: matchId,
      player_id: ids.lm,
      minute: 67,
      stoppage_time: 0,
      from_slot: "LM",
      to_slot: "SP",
      change_group_id: group,
      notes: "LM → SP",
      sort_order: 0,
    },
  ];

  const db = {
    match_lineup_entries: lineup,
    match_substitutions: subs,
    match_position_changes: pos,
  } as unknown as ClubDatabase;

  const start = getMatchShapeAtMinute(db, matchId, 0);
  const afterSub = getMatchShapeAtMinute(db, matchId, 58);
  const end = getMatchShapeAtMinute(db, matchId, 90);

  const names: Record<string, { player_id: string; name: string; shirt_number: number }> = {
    [ids.gk]: { player_id: ids.gk, name: "Keeper", shirt_number: 1 },
    [ids.lb]: { player_id: ids.lb, name: "LB", shirt_number: 5 },
    [ids.lcb]: { player_id: ids.lcb, name: "LCB", shirt_number: 3 },
    [ids.rcb]: { player_id: ids.rcb, name: "RCB", shirt_number: 4 },
    [ids.rb]: { player_id: ids.rb, name: "RB", shirt_number: 2 },
    [ids.lcvm]: { player_id: ids.lcvm, name: "LCVM", shirt_number: 6 },
    [ids.rcvm]: { player_id: ids.rcvm, name: "RCVM", shirt_number: 8 },
    [ids.lm]: { player_id: ids.lm, name: "Emma de Mie", shirt_number: 20 },
    [ids.cam]: { player_id: ids.cam, name: "CAM", shirt_number: 10 },
    [ids.rm]: { player_id: ids.rm, name: "RM", shirt_number: 7 },
    [ids.sp]: { player_id: ids.sp, name: "Spits", shirt_number: 9 },
    [ids.bench1]: { player_id: ids.bench1, name: "Invalster", shirt_number: 16 },
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
        TESTFIXTURE — match shape reconstructie · geen database · niet productie
      </p>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-zvv-ink">
        <li>Start: Emma de Mie op LM, Spits op SP</li>
        <li>58′ Spits eruit · Invalster erin als SP</li>
        <li>67′ Emma de Mie LM → SP</li>
      </ol>
      <FormationPitch slots={start.slots} playersById={names} title="Startopstelling" />
      <FormationPitch slots={afterSub.slots} playersById={names} title="Na wissel (58′)" />
      <FormationPitch slots={end.slots} playersById={names} title="Eindopstelling (90′)" />
      <p className="text-xs text-zvv-muted">
        Eind: SP = {end.slots.SP ? names[end.slots.SP]?.name : "leeg"} · LM ={" "}
        {end.slots.LM ? names[end.slots.LM]?.name : "leeg"} · warnings: {end.warnings.length}
      </p>
      <pre className="hidden">{JSON.stringify(emptyFormationMap())}</pre>
    </div>
  );
}
