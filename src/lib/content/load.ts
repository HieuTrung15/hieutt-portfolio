// Reads, validates and serializes the content/ folder. Plain Node (no Next/React imports) so the
// Content Studio and the test runner can use the exact same rules as the website build.
import fs from "node:fs";
import path from "node:path";
import type { z } from "zod";
import { LOCALES, ProjectSchema, SINGLETONS, type ContentSource, type Locale, type RawContent } from "./schema.ts";

export const CONTENT_DIR = "content";
export const PROJECTS_DIR = "projects";
export const CASE_STUDIES_DIR = "case-studies";

const listFiles = (dir: string, ext: string) =>
  fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(ext)).sort() : [];

export function readRawContent(root: string): RawContent {
  const dir = path.join(root, CONTENT_DIR);
  const readJson = (rel: string): unknown => {
    try {
      return JSON.parse(fs.readFileSync(path.join(dir, rel), "utf8"));
    } catch (e) {
      throw new Error(`content/${rel}: ${(e as Error).message}`);
    }
  };
  const raw = Object.fromEntries(
    Object.entries(SINGLETONS).map(([key, { file }]) => [key, readJson(file)]),
  ) as RawContent;
  raw.projects = {};
  raw.caseStudies = {};
  for (const f of listFiles(path.join(dir, PROJECTS_DIR), ".json"))
    raw.projects[f.slice(0, -".json".length)] = readJson(`${PROJECTS_DIR}/${f}`);
  for (const f of listFiles(path.join(dir, CASE_STUDIES_DIR), ".md")) {
    // Case studies are named <slug>.<locale>.md, e.g. vhrm.en.md
    const match = /^(.+)\.([a-z]{2})\.md$/.exec(f);
    if (!match || !LOCALES.includes(match[2] as Locale))
      throw new Error(`content/${CASE_STUDIES_DIR}/${f}: tên file phải có dạng <slug>.(${LOCALES.join("|")}).md`);
    (raw.caseStudies[match[1]] ??= {})[match[2] as Locale] = fs.readFileSync(path.join(dir, CASE_STUDIES_DIR, f), "utf8");
  }
  return raw;
}

export type ValidationResult =
  | { ok: true; content: ContentSource; errors: []; warnings: string[] }
  | { ok: false; errors: string[]; warnings: string[] };

export function validateContent(raw: RawContent): ValidationResult {
  const errors: string[] = [];
  const parse = <T>(schema: z.ZodType<T>, value: unknown, where: string): T | undefined => {
    const r = schema.safeParse(value);
    if (r.success) return r.data;
    for (const issue of r.error.issues)
      errors.push(`${where}${issue.path.length ? ` › ${issue.path.join(".")}` : ""}: ${issue.message}`);
  };

  const parsed: Record<string, unknown> = {};
  for (const [key, { file, schema }] of Object.entries(SINGLETONS))
    parsed[key] = parse(schema as z.ZodType<unknown>, raw[key as keyof typeof SINGLETONS], file);

  const projects: ContentSource["projects"] = [];
  for (const [file, value] of Object.entries(raw.projects ?? {})) {
    const p = parse(ProjectSchema, value, `projects/${file}.json`);
    if (!p) continue;
    if (p.slug !== file) errors.push(`projects/${file}.json › slug: "${p.slug}" phải trùng tên file "${file}"`);
    projects.push(p);
  }
  if (errors.length) return { ok: false, errors, warnings: [] };

  const content = { ...parsed, projects, caseStudies: { ...(raw.caseStudies ?? {}) } } as ContentSource;
  checkReferences(content, errors);
  const warnings = missingTranslations(content);
  if (errors.length) return { ok: false, errors, warnings };

  content.projects.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  return { ok: true, content, errors: [], warnings };
}

export const isLocalized = (v: object) =>
  Object.keys(v).length > 0 && Object.keys(v).every((k) => (LOCALES as readonly string[]).includes(k));

/** Translatable fields filled in only one language (the site then shows the other language there). */
export function missingTranslations(c: ContentSource): string[] {
  const out: string[] = [];
  const filled = (x: unknown) => (Array.isArray(x) ? x.length > 0 : typeof x === "string" && x.trim() !== "");
  const walk = (v: unknown, where: string) => {
    if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${where}.${i}`));
    if (!v || typeof v !== "object") return;
    if (isLocalized(v)) {
      const o = v as Record<string, unknown>;
      if (LOCALES.some((l) => filled(o[l]))) for (const l of LOCALES) if (!filled(o[l])) out.push(`${where}: thiếu bản "${l}"`);
      return;
    }
    for (const [k, x] of Object.entries(v)) walk(x, where ? `${where}.${k}` : k);
  };
  for (const [key, { file }] of Object.entries(SINGLETONS)) {
    const before = out.length;
    walk(c[key as keyof typeof SINGLETONS], "");
    for (let i = before; i < out.length; i++) out[i] = `${file} › ${out[i]}`;
  }
  for (const p of c.projects) {
    const before = out.length;
    walk(p, "");
    for (let i = before; i < out.length; i++) out[i] = `projects/${p.slug}.json › ${out[i]}`;
  }
  for (const [slug, md] of Object.entries(c.caseStudies))
    for (const l of LOCALES) if (!md[l]?.trim()) out.push(`${CASE_STUDIES_DIR}/${slug}.${l}.md: chưa có bản "${l}"`);
  return out;
}

function checkReferences(c: ContentSource, errors: string[]) {
  const unique = (ids: string[], where: string) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) errors.push(`${where}: ID "${id}" bị trùng`);
      seen.add(id);
    }
    return seen;
  };
  const mustExist = (ids: string[], known: Set<string>, where: string, what: string) => {
    for (const id of ids) if (!known.has(id)) errors.push(`${where}: ${what} "${id}" không tồn tại`);
  };

  unique(c.site.sections.map((s) => s.id), "site.json › sections");
  const categories = unique(c.site.projectCategories.map((x) => x.id), "site.json › projectCategories");
  const groups = unique(c.skills.groups.map((g) => g.id), "skills.json › groups");
  const skills = unique(c.skills.skills.map((s) => s.id), "skills.json › skills");
  unique(c.experience.map((e) => e.id), "experience.json");
  const slugs = new Set(c.projects.map((p) => p.slug));

  for (const s of c.skills.skills) mustExist([s.group], groups, `skills.json › ${s.id}`, "nhóm");
  for (const e of c.experience) {
    mustExist(e.projects, slugs, `experience.json › ${e.id}`, "dự án");
    if (e.end && e.end < e.start) errors.push(`experience.json › ${e.id}: ngày kết thúc trước ngày bắt đầu`);
  }
  for (const p of c.projects) {
    const where = `projects/${p.slug}.json`;
    mustExist(p.categories, categories, where, "danh mục");
    mustExist(p.skillIds, skills, where, "kỹ năng");
    if (p.diagram) {
      const nodes = unique(p.diagram.nodes.map((n) => n.id), `${where} › diagram.nodes`);
      for (const edge of p.diagram.edges) mustExist([edge.from, edge.to], nodes, `${where} › diagram.edges`, "node");
    }
  }
  for (const slug of Object.keys(c.caseStudies))
    if (!slugs.has(slug)) errors.push(`case-studies/${slug}.*.md: không có dự án "${slug}" tương ứng`);
}

/** Loads and validates content; throws one error listing every problem. */
export function loadContent(root: string): ContentSource {
  const result = validateContent(readRawContent(root));
  if (!result.ok) throw new Error(`Nội dung không hợp lệ:\n  - ${result.errors.join("\n  - ")}`);
  return result.content;
}

/** Maps raw content to the files it lives in (paths relative to content/). Empty case studies have no file. */
export function serializeContent(raw: RawContent): Map<string, string> {
  const files = new Map<string, string>();
  const json = (v: unknown) => `${JSON.stringify(v, null, 2)}\n`;
  for (const [key, { file }] of Object.entries(SINGLETONS)) files.set(file, json(raw[key as keyof typeof SINGLETONS]));
  for (const [slug, p] of Object.entries(raw.projects)) files.set(`${PROJECTS_DIR}/${slug}.json`, json(p));
  for (const [slug, byLocale] of Object.entries(raw.caseStudies))
    for (const locale of LOCALES) {
      const md = byLocale?.[locale];
      if (md?.trim()) files.set(`${CASE_STUDIES_DIR}/${slug}.${locale}.md`, md.endsWith("\n") ? md : `${md}\n`);
    }
  return files;
}

/** Every content file currently on disk (paths relative to content/), for diffing against serializeContent. */
export function listContentFiles(root: string): string[] {
  const dir = path.join(root, CONTENT_DIR);
  return [
    ...Object.values(SINGLETONS).map((s) => s.file).filter((f) => fs.existsSync(path.join(dir, f))),
    ...listFiles(path.join(dir, PROJECTS_DIR), ".json").map((f) => `${PROJECTS_DIR}/${f}`),
    ...listFiles(path.join(dir, CASE_STUDIES_DIR), ".md").map((f) => `${CASE_STUDIES_DIR}/${f}`),
  ];
}
