import { AcademyRouteStub } from "@/components/academy/academy-route-stub";
import { parseAcademyHighlightQuery } from "@/lib/academy/navigation-policy";

/**
 * T-02-01 / T-02-02 — S-20 Positie entry.
 * Acceptatie: `?highlight=week` (push deep link). Dashboard widgets = WP04.
 */
export default async function AcademyPositiePage({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string }>;
}) {
  const sp = await searchParams;
  const highlight = parseAcademyHighlightQuery(sp.highlight);
  const highlightNote =
    highlight === "week"
      ? " Deep link highlight=week actief (WeekCard volgt in WP04)."
      : "";

  return (
    <AcademyRouteStub
      title="Positie"
      description={`Positie-dashboard volgt in een latere Sprint-taak. Route-entry is actief.${highlightNote}`}
    />
  );
}
