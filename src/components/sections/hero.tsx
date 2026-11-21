import type { Content } from "@/lib/content/schema";
import { t } from "@/lib/i18n";
import { HeroArt } from "./hero-art";
import { Typewriter } from "./typewriter";

export function Hero({ c }: { c: Content }) {
  const dict = t(c.locale).hero;
  const roles = c.profile.eyebrow.split("·").map((r) => r.trim()).filter(Boolean);
  return (
    <section
      id="home"
      data-section
      aria-labelledby="home-title"
      className="mx-auto grid min-h-[calc(100dvh-5rem)] max-w-[1320px] items-center gap-8 px-6 pb-12 sm:px-10 lg:grid-cols-[7fr_5fr]"
    >
      <div className="pt-10 lg:pt-0 lg:pl-8">
        <p className="text-[1.9rem] font-medium sm:text-[2.4rem]">
          {c.profile.greeting}{" "}
          <span className="wave" role="img" aria-label="waving hand">
            👋🏻
          </span>
        </p>
        <h1 id="home-title" className="mt-6 text-[1.9rem] leading-tight font-medium uppercase sm:text-[2.5rem]">
          {dict.iam} <strong className="font-bold text-brand">{c.profile.name}</strong>
        </h1>
        <div className="mt-10 sm:mt-14">
          <Typewriter words={roles} />
        </div>
      </div>
      <HeroArt labels={c.profile.coreStack} label={dict.illustration} />
    </section>
  );
}
