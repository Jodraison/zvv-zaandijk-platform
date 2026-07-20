import { AcademyRouteStub } from "@/components/academy/academy-route-stub";

/** T-02-01 — Content shell entry (engine = WP05). No registry/L5 render. */
export default async function AcademyContentPage({
  params,
}: {
  params: Promise<{ pb: string }>;
}) {
  const { pb } = await params;
  return (
    <AcademyRouteStub
      title="Content"
      description={`Content-engine volgt later. Entry voor ${pb} is actief.`}
    />
  );
}
