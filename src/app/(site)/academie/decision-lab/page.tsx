import type { Metadata } from "next";
import Link from "next/link";
import { AcademyAppShell } from "@/components/academie/academy-app-shell";
import { DecisionLabHub } from "@/components/decision-lab/decision-lab-hub";

export const metadata: Metadata = {
  title: "Decision Lab — Football Academy",
  description: "Leerpad Decision Lab — wedstrijdkeuzes trainen binnen Football Academy.",
};

export default function DecisionLabIndexPage() {
  return (
    <AcademyAppShell>
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-zvv-muted">
        <Link href="/academie" className="transition hover:text-zvv-ink">
          Football Academy
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zvv-ink">Decision Lab</span>
      </nav>
      <DecisionLabHub />
    </AcademyAppShell>
  );
}
