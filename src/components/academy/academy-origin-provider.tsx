"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { academyRoutes } from "@/lib/academy/routes";

/**
 * Origin stack for content Back (T-02-02 / Proto §1.7).
 * Seeded from `?origin=` on content routes; default = Positie.
 */
type AcademyOriginContextValue = {
  origin: string;
};

const AcademyOriginContext = createContext<AcademyOriginContextValue>({
  origin: academyRoutes.positie,
});

export function AcademyOriginProvider({
  origin,
  children,
}: {
  origin?: string | null;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({
      origin: origin && origin.length > 0 ? origin : academyRoutes.positie,
    }),
    [origin],
  );

  return (
    <AcademyOriginContext.Provider value={value}>{children}</AcademyOriginContext.Provider>
  );
}

export function useAcademyOrigin(): AcademyOriginContextValue {
  return useContext(AcademyOriginContext);
}
