import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AcademyAppShell } from "@/components/academie/academy-app-shell";
import { DecisionLabLessonExperience } from "@/components/decision-lab/decision-lab-lesson-experience";
import {
  getDecisionLabSession,
  listDecisionLabSessionParams,
} from "@/lib/decision-lab/session-catalog";

type Props = { params: Promise<{ sessionId: string }> };

export function generateStaticParams() {
  return listDecisionLabSessionParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sessionId } = await params;
  const session = getDecisionLabSession(sessionId);
  if (!session) return { title: "Decision Lab" };
  return {
    title: `${session.playerTitle} — Decision Lab`,
    description: session.whyItMatters,
  };
}

export default async function DecisionLabSessionPage({ params }: Props) {
  const { sessionId } = await params;
  const session = getDecisionLabSession(sessionId);
  if (!session) notFound();

  return (
    <AcademyAppShell>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-zvv-muted">
        <Link href="/academie" className="transition hover:text-zvv-ink">
          Football Academy
        </Link>
        <span className="mx-2">/</span>
        <Link href="/academie/decision-lab" className="transition hover:text-zvv-ink">
          Decision Lab
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zvv-ink">{session.primaryRole}</span>
      </nav>
      <DecisionLabLessonExperience session={session} />
    </AcademyAppShell>
  );
}
