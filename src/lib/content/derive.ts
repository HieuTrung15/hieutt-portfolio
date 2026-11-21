// Pure helpers that derive display data from validated, language-resolved content. No I/O, safe for tests.
import { localePath } from "../i18n.ts";
import type { Content, Experience, Locale, Project } from "./schema.ts";

export const PRESENT: Record<Locale, string> = { en: "Present", vi: "Hiện tại" };

/** "2025-08" → "Aug 2025" (en-US) or "08/2025" (vi). */
export const formatMonth = (ym: string, locale: Locale = "en") => {
  const [y, m] = ym.split("-");
  if (locale === "vi") return `${m}/${y}`;
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(Date.UTC(Number(y), Number(m) - 1));
};

export const formatRange = (start: string | undefined, end: string | null | undefined, locale: Locale = "en") =>
  start ? `${formatMonth(start, locale)} – ${end ? formatMonth(end, locale) : PRESENT[locale]}` : "";

/** Whole years since a YYYY-MM date. Computed at build time, so rebuild yearly to refresh. */
export function yearsSince(start: string, now = new Date()) {
  const [y, m] = start.split("-").map(Number);
  const months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
  return Math.max(0, Math.floor(months / 12));
}

/** Replaces {years} and {companies} in highlight values. Companies are counted, not durations summed. */
export const fillTokens = (value: string, c: Content, now = new Date()) =>
  value
    .replaceAll("{years}", String(yearsSince(c.profile.careerStart, now)))
    .replaceAll("{companies}", String(new Set(c.experience.map((e) => e.company)).size));

export const isVisible = (p: Pick<Project, "status">, includeDrafts: boolean) => includeDrafts || p.status === "published";

export const currentExperience = (c: Content): Experience | undefined => c.experience.find((e) => e.end === null);

export const projectExperience = (slug: string, c: Content) => c.experience.find((e) => e.projects.includes(slug));

/** Project dates if confirmed, otherwise the employment period it belongs to (flagged as context). */
export function projectPeriod(p: Project, c: Content): { label: string; isContext: boolean } | null {
  if (p.start) return { label: formatRange(p.start, p.end, c.locale), isContext: false };
  const e = projectExperience(p.slug, c);
  return e ? { label: formatRange(e.start, e.end, c.locale), isContext: true } : null;
}

export function relatedProjects(p: Project, projects: Project[], limit = 3) {
  const shared = (a: string[], b: string[]) => a.filter((x) => b.includes(x)).length;
  return projects
    .filter((o) => o.slug !== p.slug)
    .map((o) => ({ o, score: shared(o.categories, p.categories) * 2 + shared(o.technologies, p.technologies) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.o.order - b.o.order)
    .slice(0, limit)
    .map((x) => x.o);
}

export const usedCategories = (c: Content, projects: Project[]) =>
  c.site.projectCategories.filter((cat) => projects.some((p) => p.categories.includes(cat.id)));

/** True when a published project only has a summary (CV gives no detail yet). */
export const isPendingDetail = (p: Project, c: Content) =>
  !c.caseStudies[p.slug]?.trim() && p.modules.length === 0 && p.responsibilities.length === 0;

/** Labels for the generated project illustration: diagram nodes, else modules. */
export const visualLabels = (p: Project) =>
  (p.diagram?.nodes.map((n) => n.label) ?? p.modules.map((m) => m.name)).slice(0, 6);

export type ProjectSummary = {
  slug: string;
  /** Case study URL in the content's language. */
  href: string;
  title: string;
  shortTitle: string;
  organization?: string;
  period?: string;
  category?: string;
  summary: string;
  categories: string[];
  technologies: string[];
  skillIds: string[];
  featured: boolean;
  draft: boolean;
  labels: string[];
};

export const toSummary = (p: Project, c: Content): ProjectSummary => ({
  slug: p.slug,
  href: localePath(c.locale, `/projects/${p.slug}`),
  title: p.title,
  shortTitle: p.shortTitle ?? p.title,
  organization: p.organization,
  period: projectPeriod(p, c)?.label,
  category: p.category,
  summary: p.summary ?? "",
  categories: p.categories,
  technologies: p.technologies,
  skillIds: p.skillIds,
  featured: p.featured,
  draft: p.status === "draft",
  labels: visualLabels(p),
});
