/**
 * Visual 6-min podium layout for 2026-09-07 — values unchanged.
 * Run: npx tsx src/lib/fitness/fitness-podium-layout.test.ts
 */
import assert from "node:assert/strict";
import { layoutFitnessPodium, splitPreservingOrderByPodiumIds } from "@/lib/fitness/fitness-podium-layout";

const RUN = [
  { player_id: "marisha", full_name: "Marisha Prins", shirt_number: 5, value: 1050 },
  { player_id: "dionne", full_name: "Dionne van Dijk", shirt_number: 10, value: 1000 },
  { player_id: "renee", full_name: "Renée Koopman", shirt_number: 8, value: 1000 },
  { player_id: "danique", full_name: "Danique van Heeringen", shirt_number: 7, value: 1000 },
  { player_id: "nienke", full_name: "Nienke Hoffman", shirt_number: 11, value: 1000 },
  { player_id: "andrada", full_name: "Andrada Timmer", shirt_number: 12, value: 900 },
  { player_id: "melissa", full_name: "Melissa Rietveld", shirt_number: 9, value: 850 },
  { player_id: "lorelai", full_name: "Lorelai Bakker", shirt_number: 18, value: 850 },
  { player_id: "jelisa", full_name: "Jelisa De Jonge", shirt_number: 1, value: 800 },
  { player_id: "mariska", full_name: "Mariska Oosterhuis", shirt_number: 16, value: 800 },
  { player_id: "emie", full_name: "Emie Agema", shirt_number: 17, value: 800 },
  { player_id: "anouk", full_name: "Anouk Aafjes", shirt_number: 19, value: 800 },
  { player_id: "tess", full_name: "Tess Luijting", shirt_number: 4, value: 750 },
] as const;

const TOTAL_RANK = new Map<string, number>([
  ["marisha", 1],
  ["dionne", 2],
  ["renee", 3],
  ["nienke", 4],
  ["andrada", 5],
  ["melissa", 6],
  ["emie", 7],
  ["danique", 8],
  ["anouk", 9],
  ["lorelai", 10],
  ["jelisa", 11],
  ["tess", 12],
]);

const shuffled = [...RUN].reverse();
const { podium, rest } = layoutFitnessPodium(shuffled, "higher_better", TOTAL_RANK);

assert.deepEqual(
  podium.map((r) => r.full_name),
  ["Marisha Prins", "Dionne van Dijk", "Renée Koopman"],
);
assert.deepEqual(
  podium.map((r) => r.value),
  [1050, 1000, 1000],
);
assert.deepEqual(
  rest.map((r) => r.full_name),
  [
    "Danique van Heeringen",
    "Nienke Hoffman",
    "Andrada Timmer",
    "Melissa Rietveld",
    "Lorelai Bakker",
    "Jelisa De Jonge",
    "Mariska Oosterhuis",
    "Emie Agema",
    "Anouk Aafjes",
    "Tess Luijting",
  ],
);
assert.equal(rest[0]!.value, 1000);
assert.equal(rest[1]!.value, 1000);

const visible = [...podium, ...rest];
assert.equal(visible.length, 13);
assert.equal(new Set(visible.map((r) => r.player_id)).size, 13);
assert.equal(
  visible.every((r) => RUN.some((s) => s.player_id === r.player_id && s.value === r.value)),
  true,
);

{
  const sprint = [
    { player_id: "a", full_name: "A", shirt_number: 1, value: 3.21 },
    { player_id: "b", full_name: "B", shirt_number: 2, value: 3.23 },
    { player_id: "c", full_name: "C", shirt_number: 3, value: 3.38 },
    { player_id: "d", full_name: "D", shirt_number: 4, value: 3.43 },
  ];
  const laid = layoutFitnessPodium(sprint, "lower_better", new Map());
  assert.deepEqual(
    laid.podium.map((r) => r.player_id),
    ["a", "b", "c"],
  );
  assert.deepEqual(
    laid.rest.map((r) => r.player_id),
    ["d"],
  );
}

{
  const rows = [{ player_id: "1" }, { player_id: "2" }, { player_id: "3" }, { player_id: "4" }];
  const split = splitPreservingOrderByPodiumIds(rows, rows.slice(0, 3));
  assert.deepEqual(
    split.rest.map((r) => r.player_id),
    ["4"],
  );
}

console.log("fitness-podium-layout.test.ts: ok");
