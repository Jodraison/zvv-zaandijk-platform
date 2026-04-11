"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { refreshAfterAdminSave } from "@/lib/admin-refresh";
import { deletePlayer } from "@/actions/players";

export function DeletePlayerButton({ playerId, seasonId }: { playerId: string; seasonId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100 transition-colors hover:bg-red-500/15 disabled:opacity-40"
      onClick={() => {
        if (!confirm("Speelster verwijderen uit dit seizoen? (Clubrecord blijft als ze nog in ander seizoen zit.)")) return;
        start(async () => {
          await deletePlayer(playerId, seasonId);
          refreshAfterAdminSave(router);
        });
      }}
    >
      Verwijder
    </button>
  );
}
