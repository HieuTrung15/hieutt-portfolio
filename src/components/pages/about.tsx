import { Pointer } from "lucide-react";
import type { Metadata } from "next";

import { Accent } from "@/components/accent";
import { Education } from "@/components/sections/education";
import { Experience } from "@/components/sections/experience";
import { Expertise } from "@/components/sections/expertise";
import { HeroArt } from "@/components/sections/hero-art";
import { getContent } from "@/lib/content";
import { currentExperience } from "@/lib/content/derive";
import { t, type Locale } from "@/lib/i18n";
import { paragraphs } from "@/lib/utils";
import { alternates, sectionsOn, siteOgImages } from "./shared";

export function aboutMetadata(locale: Locale): Metadata {
  const c = getContent(locale);
  const description = t(locale).profile.metaDescription(c.profile.name, c.profile.title);
  return {
    title: c.site.pageLabels.about,
    description,
    openGraph: { type: "profile", title: `${c.site.pageLabels.about} | ${c.profile.name}`, description, images: siteOgImages(locale) },
    alternates: alternates(c, "/about"),
  };
}

/** "Know who I am" story, then the about-page sections from site.json (skillset, journey, education). */
export function AboutPage({ locale }: { locale: Locale }) {
  const c = getContent(locale);
  const dict = t(locale).about;
  const { profile } = c;
  const current = currentExperience(c);
  const domains = c.skills.skills.filter((s) => s.visible && s.group === "business-domains").map((s) => s.name);
  return (
    <div className="mx-auto max-w-[1320px] px-6 sm:px-10">
      <section aria-labelledby="about-title" className="grid items-center gap-12 py-12 lg:grid-cols-[7fr_5fr]">
        <div>
          <h1 id="about-title" className="text-center text-[2rem] font-medium sm:text-[2.2rem]">
            <Accent text={profile.about.heading} />
          </h1>
          <blockquote className="mt-10 text-justify text-[1.05rem] leading-[1.9] sm:text-[1.15rem]">
            <p>
              <Accent text={dict.intro(profile.name, profile.location)} />{" "}
              {current && <Accent text={dict.current(current.position, current.company)} />}
            </p>
            {paragraphs(profile.about.body).map((p) => (
              <p key={p.slice(0, 24)} className="mt-5">
                {p}
              </p>
            ))}
            {profile.interests.length > 0 && (
              <div className="mt-6">
                <p>{dict.outside}</p>
                <ul className="mt-3 space-y-2 pl-4 text-left">
                  {profile.interests.map((i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Pointer className="size-4 shrink-0 rotate-90 text-brand" aria-hidden />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <footer className="mt-8 text-center text-muted-foreground">
              <p className="italic">“{profile.about.statement}”</p>
              <p className="mt-1">— {profile.name}</p>
            </footer>
          </blockquote>
        </div>
        <HeroArt variant="code" labels={domains.length ? domains : profile.coreStack} label={dict.illustration} />
      </section>

      {sectionsOn(c, "/about").map((s) => {
        switch (s.id) {
          case "expertise":
            return <Expertise key={s.id} c={c} section={s} />;
          case "experience":
            return <Experience key={s.id} c={c} section={s} />;
          case "education":
            return <Education key={s.id} c={c} section={s} />;
        }
      })}
    </div>
  );
}
