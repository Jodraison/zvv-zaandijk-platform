import { create } from "zustand";

export type GoalRow = {
  clientId: string;
  scorerId: string;
  assistId: string;
};

type MatchEntryGoalStore = {
  goalRows: GoalRow[];
  addGoalRow: () => void;
  removeGoalRow: (clientId: string) => void;
  setGoalRow: (clientId: string, patch: Partial<Pick<GoalRow, "scorerId" | "assistId">>) => void;
  resetGoalRows: () => void;
};

const newRow = (): GoalRow => ({
  clientId: crypto.randomUUID(),
  scorerId: "",
  assistId: "",
});

export const useMatchEntryGoalStore = create<MatchEntryGoalStore>((set) => ({
  goalRows: [newRow()],
  addGoalRow: () => set((s) => ({ goalRows: [...s.goalRows, newRow()] })),
  removeGoalRow: (clientId) =>
    set((s) => ({ goalRows: s.goalRows.filter((r) => r.clientId !== clientId) })),
  setGoalRow: (clientId, patch) =>
    set((s) => ({
      goalRows: s.goalRows.map((r) => (r.clientId === clientId ? { ...r, ...patch } : r)),
    })),
  resetGoalRows: () => set({ goalRows: [newRow()] }),
}));
