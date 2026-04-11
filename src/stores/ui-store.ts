import { create } from "zustand";

type UiStore = {
  mobileNavOpen: boolean;
  setMobileNavOpen: (v: boolean) => void;
  confirmDialog: { title: string; message: string; onConfirm: () => void } | null;
  openConfirm: (p: { title: string; message: string; onConfirm: () => void }) => void;
  closeConfirm: () => void;
};

export const useUiStore = create<UiStore>((set) => ({
  mobileNavOpen: false,
  setMobileNavOpen: (v) => set({ mobileNavOpen: v }),
  confirmDialog: null,
  openConfirm: (p) => set({ confirmDialog: p }),
  closeConfirm: () => set({ confirmDialog: null }),
}));
