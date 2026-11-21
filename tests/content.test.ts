import assert from "node:assert/strict";
import { test } from "node:test";

import { fillTokens, formatRange, isVisible, projectPeriod, relatedProjects, yearsSince } from "../src/lib/content/derive.ts";
import { loadContent, readRawContent, validateContent } from "../src/lib/content/load.ts";
import { localize } from "../src/lib/content/localize.ts";
import type { RawContent } from "../src/lib/content/schema.ts";
import { dictionaries, localeFromPath, localePath, stripLocale, switchLocalePath } from "../src/lib/i18n.ts";
import { matches } from "../src/lib/search.ts";

const root = process.cwd();
const source = loadContent(root);
const en = localize(source, "en");
const vi = localize(source, "vi");
const content = en;
const clone = (): RawContent => structuredClone(readRawContent(root));
const errorsOf = (raw: RawContent) => {
  const r = validateContent(raw);
  return r.ok ? [] : r.errors;
};

test("real content passes validation", () => {
  assert.equal(content.projects.length, 7);
});

test("employment history matches the CV exactly (both languages)", () => {
  assert.deepEqual(vi.experience.map((e) => [e.company, e.position, formatRange(e.start, e.end, "vi")]), [
    ["Tập đoàn Dệt may Việt Nam", "ERPNext Developer", "08/2025 – Hiện tại"],
    ["Công ty Cổ phần Công nghệ NXCOM", "ERPNext Consultant", "07/2023 – 08/2025"],
    ["Công ty Cổ phần Giải pháp Công nghệ Lotusa", "ERPNext Developer", "01/2022 – 07/2023"],
    ["BnK Solution", "Developer", "01/2021 – 01/2022"],
  ]);
  assert.deepEqual(en.experience.map((e) => [e.position, formatRange(e.start, e.end, "en")]), [
    ["ERPNext Developer", "Aug 2025 – Present"],
    ["ERPNext Consultant", "Jul 2023 – Aug 2025"],
    ["ERPNext Developer", "Jan 2022 – Jul 2023"],
    ["Developer", "Jan 2021 – Jan 2022"],
  ]);
  assert.equal(en.experience[0].company, "Vietnam National Textile and Garment Group");
  assert.deepEqual(vi.education.map((e) => [e.school, e.major, formatRange(e.start, e.end, "vi")]), [
    ["Đại học Công nghiệp Hà Nội", "Công nghệ thông tin", "07/2017 – 07/2021"],
  ]);
  assert.deepEqual([en.education[0].school, en.education[0].major], ["Hanoi University of Industry", "Information Technology"]);
});

test("project titles, featured set and periods match the CV", () => {
  assert.deepEqual(
    content.projects.map((p) => p.title),
    [
      "VHRM — Enterprise Human Resource Management",
      "EUP Group — Manufacturing & Supply Chain ERP",
      "Helencare ERP — Integrated Business Management",
      "HBG ERP",
      "YBM ERP",
      "HRMSND",
      "Water Infrastructure Management Website",
    ],
  );
  assert.deepEqual(content.projects.filter((p) => p.featured).map((p) => p.slug), ["vhrm", "eup-group", "helencare"]);
  const period = (slug: string, c = vi) => projectPeriod(c.projects.find((p) => p.slug === slug)!, c);
  assert.deepEqual(period("eup-group"), { label: "07/2023 – 08/2025", isContext: false });
  assert.deepEqual(period("eup-group", en), { label: "Jul 2023 – Aug 2025", isContext: false });
  // YBM has no confirmed project dates: shown as the NXCOM employment period, flagged as context.
  assert.deepEqual(period("ybm-erp"), { label: "07/2023 – 08/2025", isContext: true });
});

test("no fabricated metrics, no private data, no invented links", () => {
  // URLs are dropped first: percent-encoding such as "hi%E1%BA%BF" is not a metric.
  const text = JSON.stringify(readRawContent(root)).replace(/https:\/\/[^"]+/g, "");
  assert.doesNotMatch(text, /\d+\s?%/, "percent metrics");
  assert.doesNotMatch(text, /\b(ROI|uptime|revenue|doanh thu|tiết kiệm chi phí)\b/i);
  assert.doesNotMatch(text, /(\+84|\b0\d{9}\b)/, "phone numbers");
  assert.doesNotMatch(text, /ngày sinh|giới tính|date of birth|GPA/i);
  const numbers = text.match(/\b\d+\+/g) ?? [];
  assert.deepEqual([...new Set(numbers)], ["400+"], "only the CV-backed 400+ figure");
  for (const l of content.socialLinks) assert.ok(l.url === "" || l.url.startsWith("https://"));
  assert.match(content.site.url ?? "", /^(https:\/\/[a-z0-9.-]+)?$/, "domain is https, without a path or trailing slash");
});

test("highlights compute years and companies instead of hard-coding them", () => {
  assert.equal(yearsSince("2021-01", new Date(2026, 10, 20)), 5);
  assert.equal(yearsSince("2021-01", new Date(2025, 11, 31)), 4);
  assert.equal(yearsSince("2021-01", new Date(2026, 0, 1)), 5);
  assert.equal(fillTokens("{years}+", content, new Date(2027, 0, 1)), "6+");
  assert.equal(fillTokens("{companies}", content), "4");
});

test("drafts are hidden from production and visible in dev", () => {
  const draft = { ...content.projects[0], status: "draft" as const };
  assert.equal(isVisible(draft, false), false);
  assert.equal(isVisible(draft, true), true);
  const raw = clone();
  raw.projects["new-idea"] = { slug: "new-idea", title: "Chưa đủ thông tin", status: "draft" };
  assert.deepEqual(errorsOf(raw), [], "a draft with only slug + title is saveable");
});

test("validation rejects broken content with readable messages", () => {
  const cases: [string, (r: RawContent) => void, RegExp][] = [
    ["slug ≠ file name", (r) => ((r.projects.vhrm as { slug: string }).slug = "other"), /phải trùng tên file/],
    ["unknown skill", (r) => (r.projects.vhrm as { skillIds: string[] }).skillIds.push("cobol"), /kỹ năng "cobol" không tồn tại/],
    ["published without summary", (r) => delete (r.projects.vhrm as { summary?: object }).summary, /cần có tóm tắt/],
    ["translation with no language", (r) => ((r.profile as { statement: object }).statement = { en: "", vi: " " }), /ít nhất một ngôn ngữ/],
    ["bad month", (r) => ((r.experience as { start: string }[])[0].start = "2025-13"), /YYYY-MM/],
    ["end before start", (r) => ((r.experience as { end: string }[])[1].end = "2020-01"), /trước ngày bắt đầu/],
    ["edge to missing node", (r) => (r.projects["eup-group"] as { diagram: { edges: object[] } }).diagram.edges.push({ from: "selling", to: "ghost" }), /node "ghost"/],
    ["orphan case study", (r) => (r.caseStudies.ghost = { en: "x" }), /không có dự án "ghost"/],
    ["experience → unknown project", (r) => (r.experience as { projects: string[] }[])[0].projects.push("ghost"), /dự án "ghost"/],
    ["invalid email", (r) => ((r.profile as { email: string }).email = "not-an-email"), /Email không hợp lệ/],
    ["social link not https", (r) => ((r.socialLinks as { url: string }[])[0].url = "javascript:alert(1)"), /https/],
    ["asset path traversal", (r) => ((r.profile as { avatar: string }).avatar = "/../secret.png"), /public/],
  ];
  for (const [name, mutate, expected] of cases) {
    const raw = clone();
    mutate(raw);
    const errors = errorsOf(raw);
    assert.ok(errors.some((e) => expected.test(e)), `${name}: ${errors.join(" | ") || "no error"}`);
  }
});

test("related projects share categories or technology", () => {
  const eup = content.projects.find((p) => p.slug === "eup-group")!;
  const related = relatedProjects(eup, content.projects).map((p) => p.slug);
  assert.ok(related.includes("helencare"));
  assert.ok(!related.includes("eup-group"));
});

test("search is accent-insensitive for Vietnamese", () => {
  assert.ok(matches("nhan su", ["Hệ thống quản trị nhân sự"]));
  assert.ok(matches("dệt may", ["Tập đoàn Dệt may Việt Nam"]));
  assert.ok(matches("det", ["Đệt"]));
  assert.ok(!matches("odoo", ["ERPNext"]));
});

test("each language resolves its own text and falls back to the other when missing", () => {
  assert.equal(en.profile.greeting, "Hi There!");
  assert.equal(vi.profile.greeting, "Xin chào!");
  assert.equal(en.site.sections.find((s) => s.id === "work")!.label, "Selected Work");
  assert.equal(vi.site.sections.find((s) => s.id === "work")!.label, "Dự án tiêu biểu");
  assert.ok(en.caseStudies.vhrm.startsWith("VHRM is"));
  assert.ok(vi.caseStudies.vhrm.startsWith("VHRM là"));
  assert.deepEqual(vi.profile.interests, ["Đọc tiểu thuyết"]);

  const raw = clone();
  (raw.profile as { statement: object }).statement = { en: "English only" };
  (raw.profile as { interests: object }).interests = { en: [], vi: ["Chỉ tiếng Việt"] };
  delete raw.caseStudies.vhrm.en;
  const r = validateContent(raw);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(localize(r.content, "vi").profile.statement, "English only");
  assert.deepEqual(localize(r.content, "en").profile.interests, ["Chỉ tiếng Việt"]);
  assert.ok(localize(r.content, "en").caseStudies.vhrm.startsWith("VHRM là"));
  assert.deepEqual(
    r.warnings.filter((w) => /statement|interests|vhrm\.en/.test(w)),
    ['profile.json › statement: thiếu bản "vi"', 'profile.json › interests: thiếu bản "en"', 'case-studies/vhrm.en.md: chưa có bản "en"'],
  );
});

test("current content is translated in both languages", () => {
  const r = validateContent(readRawContent(root));
  assert.deepEqual(r.warnings, []);
});

test("locale paths: English at /, Vietnamese under /vi", () => {
  assert.equal(localePath("en", "/projects"), "/projects");
  assert.equal(localePath("vi", "/"), "/vi");
  assert.equal(localePath("vi", "/projects/vhrm"), "/vi/projects/vhrm");
  assert.equal(localePath("vi", "/#work"), "/vi#work");
  assert.equal(stripLocale("/vi"), "/");
  assert.equal(stripLocale("/vi/projects/vhrm"), "/projects/vhrm");
  assert.equal(stripLocale("/projects"), "/projects");
  assert.equal(stripLocale("/video"), "/video");
  assert.equal(localeFromPath("/vi/about"), "vi");
  assert.equal(localeFromPath("/about"), "en");
  assert.equal(switchLocalePath("/vi/projects/vhrm", "en"), "/projects/vhrm");
  assert.equal(switchLocalePath("/_not-found", "vi"), "/vi");
});

test("UI dictionaries have the same keys in both languages", () => {
  const shape = (o: unknown): unknown =>
    o && typeof o === "object" ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Array.isArray(v) ? v.length : shape(v)])) : typeof o;
  assert.deepEqual(shape(dictionaries.vi), shape(dictionaries.en));
});
