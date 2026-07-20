import { AcademyRouteStub } from "@/components/academy/academy-route-stub";
import { requireAcademySlugParam } from "@/lib/academy/route-params";

/** T-02-02 — `/situatie/:poort` (S-31). Engine = WP06. */
export default async function AcademySituatiePoortPage({
  params,
}: {
  params: Promise<{ poort: string }>;
}) {
  const { poort: raw } = await params;
  const poort = requireAcademySlugParam(raw);

  return (
    <AcademyRouteStub
      title="Situatie"
      description={`Situatie-poort “${poort}” volgt later (WP06). Deep-link entry is actief.`}
    />
  );
}
