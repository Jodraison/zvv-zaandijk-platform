import { redirect } from "next/navigation";
import { academyRoutes } from "@/lib/academy/routes";

/**
 * T-02-01 — Academy root resolves to canonical home (Positie).
 * No separate Home screen (ARCH: Positie = home).
 */
export default function AcademyRootPage() {
  redirect(academyRoutes.positie);
}
