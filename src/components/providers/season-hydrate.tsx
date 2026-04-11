"use client";

import { useEffect } from "react";
import { useSeasonStore } from "@/stores/season-store";

export function SeasonHydrate({ seasonId }: { seasonId: string }) {
  useEffect(() => {
    useSeasonStore.getState().setSeasonId(seasonId);
  }, [seasonId]);
  return null;
}
