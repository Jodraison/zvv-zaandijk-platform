import { AcademyOriginProvider } from "@/components/academy/academy-origin-provider";
import { AcademyRouteStub } from "@/components/academy/academy-route-stub";
import {
  parseAcademyLayerQuery,
  parseAcademyOriginQuery,
} from "@/lib/academy/navigation-policy";
import { requireAcademyPlaybookParam } from "@/lib/academy/route-params";

/**
 * T-02-01 / T-02-02 — Content shell entry (engine = WP05).
 * Supports `?layer=` · `?origin=` · format-valid `pb.{n}` only.
 */
export default async function AcademyContentPage({
  params,
  searchParams,
}: {
  params: Promise<{ pb: string }>;
  searchParams: Promise<{ layer?: string; origin?: string; highlight?: string }>;
}) {
  const { pb: rawPb } = await params;
  const pb = requireAcademyPlaybookParam(rawPb);
  const sp = await searchParams;
  const layer = parseAcademyLayerQuery(sp.layer);
  const origin = parseAcademyOriginQuery(sp.origin);
  const layerNote = layer ? ` Layer ${layer}.` : " Geen/ongeldige layer-query (default volgt in WP05).";
  const originNote = origin ? ` Origin: ${origin}.` : "";

  return (
    <AcademyOriginProvider origin={origin}>
      <AcademyRouteStub
        title="Content"
        description={`Content-engine volgt later. Entry voor ${pb} is actief.${layerNote}${originNote}`}
      />
    </AcademyOriginProvider>
  );
}
