import type { Metadata } from "next";

import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";
import { Hero } from "@/components/sections/hero";
import { Highlights } from "@/components/sections/highlights";
import { getContent, getCvHref, getSiteUrl, visibleSocialLinks } from "@/lib/content";
import { currentExperience } from "@/lib/content/derive";
import { LOCALE_INFO, localePath, type Locale } from "@/lib/i18n";
import { alternates, sectionsOn } from "./shared";

export function homeMetadata(locale: Locale): Metadata {
  const c = getContent(locale);
  return { title: { absolute: c.site.title }, alternates: alternates(c, "/") };
}

/** Person structured data with public fields only (no birth date, phone or address). */
function personJsonLd(locale: Locale) {
  const c = getContent(locale);
  const url = getSiteUrl(c);
  const current = currentExperience(c);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: c.profile.name,
    jobTitle: c.profile.title,
    email: `mailto:${c.profile.email}`,
    address: { "@type": "PostalAddress", addressLocality: c.profile.location },
    ...(url && { url: url + localePath(locale, "/") }),
    ...(current && { worksFor: { "@type": "Organization", name: current.company } }),
    alumniOf: c.education.map((e) => ({ "@type": "EducationalOrganization", name: e.school })),
    knowsAbout: c.skills.skills.filter((s) => s.visible).map((s) => s.name),
    knowsLanguage: Object.values(LOCALE_INFO).map((l) => l.hreflang),
    sameAs: visibleSocialLinks(c).map((l) => l.url),
  };
}

// Escapes "<" inside JSON-LD so content can never close the <script> tag (backslash + u003c).
const LT_ESCAPE = String.fromCharCode(92) + "u003c";

export function HomePage({ locale }: { locale: Locale }) {
  const c = getContent(locale);
  const cvHref = getCvHref(c);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd(locale)).replace(/</g, LT_ESCAPE) }} />
      {sectionsOn(c, "/").map((s) => {
        switch (s.id) {
          case "home":
            return <Hero key={s.id} c={c} />;
          case "about":
            return <About key={s.id} c={c} section={s} />;
          case "highlights":
            return <Highlights key={s.id} c={c} section={s} />;
          case "contact":
            return <Contact key={s.id} c={c} section={s} cvHref={cvHref} />;
        }
      })}
    </>
  );
}
