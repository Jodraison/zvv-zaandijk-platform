import { AcademyRouteStub } from "@/components/academy/academy-route-stub";
import { requireAcademySlugParam } from "@/lib/academy/route-params";

/** T-02-02 — `/probleem/:slug` (S-36). Engine = WP07. Format-only slug. */
export default async function AcademyProbleemDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: raw } = await params;
  const slug = requireAcademySlugParam(raw);

  return (
    <AcademyRouteStub
      title="Probleem"
      description={`Probleem-detail voor “${slug}” volgt later (WP07). Deep-link entry is actief.`}
    />
  );
}
