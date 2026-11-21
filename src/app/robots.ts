import type { MetadataRoute } from "next";

import { getContent, getSiteUrl } from "@/lib/content";
import { DEFAULT_LOCALE } from "@/lib/i18n";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const url = getSiteUrl(getContent(DEFAULT_LOCALE));
  return { rules: { userAgent: "*", allow: "/" }, ...(url && { sitemap: `${url}/sitemap.xml` }) };
}
