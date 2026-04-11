import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Bebas_Neue } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ZVV Zaandijk Dames Platform",
  description: "Teamplatform ZVV Zaandijk — selectie, wedstrijden, ranking, training en fitheid.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${jakarta.variable} ${bebas.variable}`}>
      <body className="w-full overflow-x-hidden font-sans text-[15px] leading-relaxed antialiased">{children}</body>
    </html>
  );
}
