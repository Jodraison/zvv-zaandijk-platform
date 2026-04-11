import { create } from "zustand";

type SeasonStore = {
  seasonId: string | null;
  setSeasonId: (id: string | null) => void;
};

export const useSeasonStore = create<SeasonStore>((set) => ({
  seasonId: null,
  setSeasonId: (id) => set({ seasonId: id }),
}));
