import type { Metadata } from "next";
import { AcademyHomeDashboard } from "@/components/academie/academy-home-dashboard";

export const metadata: Metadata = {
  title: "Football Academy",
  description: "Leerpaden van ZVV Zaandijk VRZ1 — Decision Lab, speelwijze, posities en meer.",
};

export default function AcademiePage() {
  return <AcademyHomeDashboard />;
}
