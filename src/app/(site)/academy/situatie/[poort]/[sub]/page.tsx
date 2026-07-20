import { AcademyRouteStub } from "@/components/academy/academy-route-stub";
import { requireAcademySlugParam } from "@/lib/academy/route-params";

/** T-02-02 — `/situatie/:poort/:sub` (S-32). Engine = WP06. */
export default async function AcademySituatieDetailPage({
  params,
}: {
  params: Promise<{ poort: string; sub: string }>;
}) {
  const { poort: rawPoort, sub: rawSub } = await params;
  const poort = requireAcademySlugParam(rawPoort);
  const sub = requireAcademySlugParam(rawSub);

  return (
    <AcademyRouteStub
      title="Situatie"
      description={`Situatie-detail “${poort}/${sub}” volgt later (WP06). Deep-link entry is actief.`}
    />
  );
}
