// Next.js entry to content: cached per request in dev (so edits show on reload), once per build in production.
import fs from "node:fs";
import path from "node:path";
import { cache } from "react";

import type { Locale } from "../i18n.ts";
import { isVisible, toSummary } from "./derive.ts";
import { loadContent } from "./load.ts";
import { localize } from "./localize.ts";
import type { Content } from "./schema.ts";

/** Drafts are previewable in `next dev` and never included in a production build. */
export const INCLUDE_DRAFTS = process.env.NODE_ENV === "development";

const getSource = cache(() => loadContent(process.cwd()));

export const getContent = cache((locale: Locale) => localize(getSource(), locale));

export const getProjects = cache((locale: Locale) => getContent(locale).projects.filter((p) => isVisible(p, INCLUDE_DRAFTS)));

export const getProject = (locale: Locale, slug: string) => getProjects(locale).find((p) => p.slug === slug);

export const getSummaries = cache((locale: Locale) => getProjects(locale).map((p) => toSummary(p, getContent(locale))));

/** CV link only when the configured PDF actually exists in public/. */
export function getCvHref(c: Content) {
  const p = c.site.cvPath;
  return p && p.toLowerCase().endsWith(".pdf") && fs.existsSync(path.join(process.cwd(), "public", p)) ? p : undefined;
}

/** Production domain from SITE_URL env or site.json; undefined until configured (never invented). */
export const getSiteUrl = (c: Content) => (process.env.SITE_URL || c.site.url || "").replace(/\/$/, "") || undefined;

export const visibleSocialLinks = (c: Content) => c.socialLinks.filter((l) => l.url);
