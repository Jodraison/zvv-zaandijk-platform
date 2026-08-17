import { notFound } from "next/navigation";
import { MatchFormationEditor } from "@/components/admin/match-formation-editor";
import { MatchShapeEventsEditor } from "@/components/admin/match-shape-events-editor";
import type { FormationSlotCode } from "@/lib/match/formation-4231";

/**
 * Test-only admin UI voor opstelling / wissel / positiewijziging.
 * Geen databasewrites · niet bereikbaar in productie.
 */
export default function MatchOpsAdminFixturePage() {
  if (process.env.NODE_ENV === "production") notFound();

  const players = [
    { player_id: "p-gk", name: "Jelisa de Jonge", shirt_number: 1 },
    { player_id: "p-lb", name: "Linksback", shirt_number: 5 },
    { player_id: "p-lcb", name: "Naomi Kalmeijer", shirt_number: 3 },
    { player_id: "p-rcb", name: "Tess Luijting", shirt_number: 4 },
    { player_id: "p-rb", name: "Rechtsback", shirt_number: 2 },
    { player_id: "p-lcvm", name: "LCVM", shirt_number: 6 },
    { player_id: "p-rcvm", name: "RCVM", shirt_number: 8 },
    { player_id: "p-lm", name: "Emma de Mie", shirt_number: 20 },
    { player_id: "p-cam", name: "CAM", shirt_number: 10 },
    { player_id: "p-rm", name: "RM", shirt_number: 7 },
    { player_id: "p-sp", name: "Spits", shirt_number: 9 },
    { player_id: "p-bench1", name: "Mariska Oosterhuis", shirt_number: 16 },
  ];

  const initialSlots: Partial<Record<FormationSlotCode, string | null>> = {
    GK: "p-gk",
    LB: "p-lb",
    LCB: "p-lcb",
    RCB: "p-rcb",
    RB: "p-rb",
    LCVM: "p-lcvm",
    RCVM: "p-rcvm",
    LM: "p-lm",
    CAM: "p-cam",
    RM: "p-rm",
    SP: "p-sp",
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
        Test-only fixture — geen productiedata · geen databasewrites bij Opslaan (demoMode).
      </p>
      <MatchFormationEditor
        matchId="fixture-match"
        seasonId="fixture-season"
        players={players}
        initialSlots={initialSlots}
        initialBench={["p-bench1"]}
        initialStatus="draft"
        matchStatus="scheduled"
      />
      <MatchShapeEventsEditor
        demoMode
        matchId="fixture-match"
        players={players}
        initialSlots={initialSlots}
        initialBench={["p-bench1"]}
        initialSubs={[
          {
            player_out_id: "p-rcb",
            player_in_id: "p-bench1",
            minute: 58,
            to_slot: "RCB",
            change_group_id: "g1",
            notes: "",
          },
        ]}
        initialPos={[
          {
            player_id: "p-lm",
            minute: 67,
            from_slot: "LM",
            to_slot: "SP",
            change_group_id: "g1",
            notes: "LM → SP",
          },
        ]}
      />
    </div>
  );
}
