import type { MetadataRoute } from "next";

import { getContent, getProjects, getSiteUrl } from "@/lib/content";
import { DEFAULT_LOCALE, LOCALE_INFO, LOCALES, localePath } from "@/lib/i18n";

export const dynamic = "force-static";

// Absolute URLs need a real domain; until site.json `url` (or SITE_URL) is set the sitemap stays empty.
export default function sitemap(): MetadataRoute.Sitemap {
  const url = getSiteUrl(getContent(DEFAULT_LOCALE));
  if (!url) return [];
  const paths = ["/", "/about", "/projects", "/resume", ...getProjects(DEFAULT_LOCALE).map((p) => `/projects/${p.slug}`)];
  return paths.flatMap((path) =>
    LOCALES.map((locale) => ({
      url: url + localePath(locale, path),
      alternates: { languages: Object.fromEntries(LOCALES.map((l) => [LOCALE_INFO[l].hreflang, url + localePath(l, path)])) },
    })),
  );
}
