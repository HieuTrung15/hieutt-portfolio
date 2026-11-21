import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CommandPalette, type PaletteData } from "@/components/command-palette/command-palette";
import { LocaleProvider } from "@/components/i18n-provider";
import { navItems, SiteShell } from "@/components/layout/site-shell";
import { StarField } from "@/components/layout/star-field";
import { getContent, getProjects, getSiteUrl } from "@/lib/content";
import type { Content, SectionId } from "@/lib/content/schema";
import { DEFAULT_LOCALE, LOCALE_INFO, LOCALES, localePath, type Locale } from "@/lib/i18n";

/** Which page each configurable section lives on (order inside a page follows site.json). */
export const SECTION_PAGE: Record<SectionId, "/" | "/about" | "/projects"> = {
  home: "/",
  about: "/",
  highlights: "/",
  contact: "/",
  expertise: "/about",
  experience: "/about",
  education: "/about",
  work: "/projects",
};

export const sectionsOn = (c: Content, page: "/" | "/about") =>
  c.site.sections.filter((s) => s.visible && SECTION_PAGE[s.id] === page);

/** canonical + hreflang links; only emitted once a production domain is configured. */
export function alternates(c: Content, path: string): Metadata["alternates"] {
  if (!getSiteUrl(c)) return undefined;
  return {
    canonical: localePath(c.locale, path),
    languages: {
      ...Object.fromEntries(LOCALES.map((l) => [LOCALE_INFO[l].hreflang, localePath(l, path)])),
      "x-default": localePath(DEFAULT_LOCALE, path),
    },
  };
}

/**
 * The site-wide OG image (app/opengraph-image.tsx, app/vi/opengraph-image.tsx). Listed explicitly because a page
 * that sets its own `openGraph` replaces the parent's, dropping the inherited file-based image.
 */
export const siteOgImages = (locale: Locale) => [{ url: localePath(locale, "/opengraph-image"), width: 1200, height: 630, type: "image/png" }];

export function localeMetadata(locale: Locale): Metadata {
  const c = getContent(locale);
  const url = getSiteUrl(c);
  return {
    ...(url && { metadataBase: new URL(url) }),
    title: { default: c.site.title, template: `%s | ${c.profile.name}` },
    description: c.site.description,
    applicationName: c.profile.name,
    authors: [{ name: c.profile.name }],
    openGraph: {
      type: "website",
      locale: LOCALE_INFO[locale].ogLocale,
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => LOCALE_INFO[l].ogLocale),
      siteName: c.profile.name,
      title: c.site.title,
      description: c.site.description,
      ...(url && { url: url + localePath(locale, "/") }),
      images: siteOgImages(locale),
    },
    twitter: { card: "summary_large_image", title: c.site.title, description: c.site.description, images: siteOgImages(locale) },
    robots: { index: true, follow: true },
  };
}

function paletteData(locale: Locale): PaletteData {
  const c = getContent(locale);
  const pages = navItems(locale);
  const groupTitle = new Map(c.skills.groups.map((g) => [g.id, g.title]));
  const categoryLabel = new Map(c.site.projectCategories.map((x) => [x.id, x.label]));
  return {
    sections: c.site.sections
      .filter((s) => s.visible && s.id !== "home")
      .map((s) => {
        const page = SECTION_PAGE[s.id];
        const path = page === "/projects" ? page : page === "/" ? `/#${s.id}` : `${page}#${s.id}`;
        return { id: s.id, label: s.label, href: localePath(locale, path) };
      }),
    pages: pages.map((p) => ({ label: p.label, href: p.href })),
    projects: getProjects(locale).map((p) => ({
      slug: p.slug,
      href: localePath(locale, `/projects/${p.slug}`),
      title: p.title,
      organization: p.organization,
      keywords: [p.organization, p.category, p.industry, p.summary, ...p.technologies, ...p.categories.map((id) => categoryLabel.get(id))].filter(
        (k): k is string => !!k,
      ),
    })),
    skills: c.skills.skills
      .filter((s) => s.visible)
      .map((s) => ({ id: s.id, name: s.name, group: groupTitle.get(s.group) ?? "", href: localePath(locale, `/about#skill-${s.id}`) })),
    email: c.profile.email,
  };
}

/**
 * Everything around a page in one language: shell, command palette, locale context.
 * <html lang> is set by the root layout's boot script (full loads) and LocaleProvider (client navigation).
 */
export function LocaleLayout({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <LocaleProvider locale={locale}>
      <StarField />
      <SiteShell locale={locale}>{children}</SiteShell>
      <CommandPalette data={paletteData(locale)} />
    </LocaleProvider>
  );
}
