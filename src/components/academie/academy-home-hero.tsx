import { ACADEMY_HOME_HERO } from "@/lib/academie";

export function AcademyHomeHero() {
  return (
    <section
      className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#020817] via-[#0b1f5f] to-[#1d4ed8] px-6 py-12 shadow-[0_28px_74px_rgba(15,23,42,0.28)] sm:rounded-[2rem] sm:px-8 sm:py-14 md:px-10 md:py-16"
      aria-label="Football Academy"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_18%_12%,rgba(147,197,253,0.28),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.08),transparent_32%,rgba(2,6,23,0.26)_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.45)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="pointer-events-none absolute -right-20 top-8 h-56 w-56 rounded-full bg-blue-300/20 blur-[80px]" />

      <div className="relative z-10 max-w-3xl text-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/72 md:text-[11px]">{ACADEMY_HOME_HERO.eyebrow}</p>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-[clamp(2.75rem,9vw,5.5rem)] leading-[0.9] tracking-[0.03em] md:mt-6">
          {ACADEMY_HOME_HERO.title}
        </h1>
        <p className="mt-6 max-w-2xl text-[15px] leading-[1.75] text-blue-100/88 md:text-lg md:leading-[1.7]">{ACADEMY_HOME_HERO.subtitle}</p>
      </div>
    </section>
  );
}
