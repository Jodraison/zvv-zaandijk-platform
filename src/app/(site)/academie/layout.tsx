import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAcademiePublicVisible } from "@/lib/features/academy-public-visibility";

/**
 * WP-1 secondary guard (mirrors `/academy` layout + middleware dual pattern).
 * Primary block is middleware; this catches RSC access if middleware is bypassed.
 * When hidden: noindex + redirect `/` so metadata is not presented as a live product.
 */
export async function generateMetadata(): Promise<Metadata> {
  if (!isAcademiePublicVisible()) {
    return {
      robots: { index: false, follow: false },
    };
  }
  return {};
}

export default function AcademieLayout({ children }: { children: React.ReactNode }) {
  if (!isAcademiePublicVisible()) {
    redirect("/");
  }
  return children;
}
