/**
 * Podium slots must not drop a top-3 athlete when sporting ranks tie.
 * Run: npx tsx src/components/ranking/ranking-podium.test.ts
 */
import assert from "node:assert/strict";
import { resolvePodiumSlots, type PodiumEntry } from "@/components/ranking/ranking-podium";

function entry(partial: Pick<PodiumEntry, "player_id" | "full_name" | "shirt_number" | "rank">): PodiumEntry {
  return {
    positionLabel: "",
    valueLabel: "",
    photo_url: null,
    ...partial,
  };
}

{
  const slots = resolvePodiumSlots([
    entry({ player_id: "1", full_name: "Marisha Prins", shirt_number: 5, rank: 1 }),
    entry({ player_id: "10", full_name: "Dionne van Dijk", shirt_number: 10, rank: 2 }),
    entry({ player_id: "8", full_name: "Renée Koopman", shirt_number: 8, rank: 2 }),
  ]);
  assert.equal(slots.first?.full_name, "Marisha Prins");
  assert.equal(slots.second?.full_name, "Dionne van Dijk");
  assert.equal(slots.third?.full_name, "Renée Koopman");
}

{
  const slots = resolvePodiumSlots([
    entry({ player_id: "a", full_name: "Eén", shirt_number: 1, rank: 1 }),
    entry({ player_id: "b", full_name: "Twee", shirt_number: 2, rank: 2 }),
    entry({ player_id: "c", full_name: "Drie", shirt_number: 3, rank: 3 }),
  ]);
  assert.equal(slots.first?.full_name, "Eén");
  assert.equal(slots.second?.full_name, "Twee");
  assert.equal(slots.third?.full_name, "Drie");
}

{
  const slots = resolvePodiumSlots([
    entry({ player_id: "a", full_name: "Alleen", shirt_number: 1, rank: 1 }),
  ]);
  assert.equal(slots.first?.full_name, "Alleen");
  assert.equal(slots.second, null);
  assert.equal(slots.third, null);
}

console.log("ranking-podium.test.ts: ok");
