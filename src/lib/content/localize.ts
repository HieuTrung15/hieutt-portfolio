// Resolves stored content ({ en, vi } objects) to a single language for rendering.
import { isLocalized } from "./load.ts";
import type { Content, ContentSource, Locale, Resolved } from "./schema.ts";

/** One language from a { en, vi } value, falling back to the other language when missing. */
function pick(v: unknown, locale: Locale): unknown {
  if (Array.isArray(v)) return v.map((x) => pick(x, locale));
  if (!v || typeof v !== "object") return v;
  if (isLocalized(v)) {
    const o = v as Record<string, unknown>;
    const candidates = [o[locale], o[locale === "en" ? "vi" : "en"]];
    if (candidates.some(Array.isArray)) return candidates.find((x) => Array.isArray(x) && x.length > 0) ?? [];
    return candidates.find((x) => typeof x === "string" && x.trim() !== "") ?? "";
  }
  return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, pick(x, locale)]));
}

export function localize(source: ContentSource, locale: Locale): Content {
  const { caseStudies, ...rest } = source;
  return {
    ...(pick(rest, locale) as Omit<Resolved<ContentSource>, "caseStudies">),
    // Keyed by slug, so resolved per entry (a slug could be "en" or "vi").
    caseStudies: Object.fromEntries(Object.entries(caseStudies).map(([slug, md]) => [slug, pick(md, locale) as string])),
    locale,
  };
}
