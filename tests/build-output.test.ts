// Checks the static export in out/ (run after `pnpm build`).
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { loadContent } from "../src/lib/content/load.ts";

const out = path.join(process.cwd(), "out");
const skip = fs.existsSync(out) ? false : "out/ not found — run `pnpm build` first";
const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));

test("every published project has a page and no draft does", { skip }, () => {
  const content = loadContent(process.cwd());
  for (const p of content.projects)
    for (const dir of ["projects", "vi/projects"])
      assert.equal(fs.existsSync(path.join(out, dir, `${p.slug}.html`)), p.status === "published", `${dir}/${p.slug}`);
  for (const page of ["index.html", "projects.html", "about.html", "resume.html", "vi.html", "vi/projects.html", "vi/about.html", "vi/resume.html", "404.html", "sitemap.xml", "robots.txt"])
    assert.ok(fs.existsSync(path.join(out, page)), page);
});

test("production output contains no Content Studio or editing endpoint", { skip }, () => {
  assert.ok(!fs.existsSync(path.join(out, "api")));
  for (const file of walk(out).filter((f) => /\.(js|html|txt)$/.test(f))) {
    const text = fs.readFileSync(file, "utf8");
    assert.ok(!text.includes("x-studio-token") && !text.includes("/api/content"), `studio code found in ${file}`);
  }
});

test("no broken internal links", { skip }, () => {
  const broken = new Set<string>();
  for (const file of walk(out).filter((f) => f.endsWith(".html"))) {
    for (const [, href] of fs.readFileSync(file, "utf8").matchAll(/href="(\/[^"#?]*)/g)) {
      if (href === "/") continue;
      const target = path.join(out, decodeURIComponent(href));
      if (![target, `${target}.html`, path.join(target, "index.html")].some((f) => fs.existsSync(f) && fs.statSync(f).isFile())) broken.add(href);
    }
  }
  assert.deepEqual([...broken], []);
});

test("both résumé pages have two links that download a PDF", { skip }, () => {
  for (const [page, label] of [["resume.html", "Download"], ["vi/resume.html", "Tải về"]]) {
    const html = fs.readFileSync(path.join(out, page), "utf8");
    const links = [...html.matchAll(/<a href="(\/[^"\n]+)" download=""[^>]*>(.*?)<\/a>/g)]
      .filter(([, , content]) => content.endsWith(label));
    assert.equal(links.length, 2, page);
    for (const [, href] of links) {
      assert.match(href, /\.pdf$/i);
      const file = fs.readFileSync(path.join(out, decodeURIComponent(href)));
      assert.equal(file.subarray(0, 5).toString(), "%PDF-", href);
    }
  }
});

test("English is the default at / and every page boots the language script in <head>", { skip }, () => {
  const home = fs.readFileSync(path.join(out, "index.html"), "utf8");
  const viHome = fs.readFileSync(path.join(out, "vi.html"), "utf8");
  assert.match(home, /<html lang="en-US"/);
  assert.match(home, /Hi There!/);
  assert.match(home, /I&#x27;M/);
  assert.match(home, /<strong class="font-bold text-brand">Trần Trung Hiếu<\/strong>/);
  assert.match(home, /\("class","theme","dark"/, "dark is the default theme");
  assert.match(viHome, /Xin chào!/);
  assert.match(viHome, /TÔI LÀ/);
  assert.match(viHome, /href="\/vi\/projects"/);
  for (const page of ["index.html", "vi.html", "vi/projects/vhrm.html", "404.html"]) {
    const head = fs.readFileSync(path.join(out, page), "utf8").split("</head>")[0];
    assert.match(head, /preferred-locale/, `${page}: language boot script missing from <head>`);
  }
});

test("all original content is still published somewhere on the site", { skip }, () => {
  const read = (page: string) => fs.readFileSync(path.join(out, page), "utf8");
  const html = ["index.html", "about.html", "projects.html", "resume.html"].map(read).join("\n");
  const content = loadContent(process.cwd());
  const missing: string[] = [];
  const expectText = (label: string, text: string) => {
    const plain = text.replace(/&/g, "&amp;").replace(/'/g, "&#x27;");
    if (!html.includes(text) && !html.includes(plain)) missing.push(`${label}: ${text.slice(0, 60)}`);
  };
  for (const e of content.experience) {
    expectText("company", e.company.en ?? "");
    for (const r of e.responsibilities.en) expectText("responsibility", r);
  }
  for (const p of content.projects.filter((x) => x.status === "published")) expectText("project", p.title);
  for (const s of content.skills.skills.filter((x) => x.visible)) expectText("skill", s.name);
  for (const h of content.highlights) expectText("highlight", h.description.en ?? "");
  for (const e of content.education) expectText("education", e.school.en ?? "");
  expectText("statement", content.profile.statement.en ?? "");
  expectText("about", content.profile.about.statement.en ?? "");
  expectText("email", content.profile.email);
  for (const l of content.socialLinks.filter((x) => x.url)) expectText("social link", l.url);
  assert.deepEqual(missing, []);
});

test("deploy output: absolute URLs for the configured domain and Cloudflare headers", { skip }, () => {
  const url = loadContent(process.cwd()).site.url;
  if (!url) return;
  const sitemap = fs.readFileSync(path.join(out, "sitemap.xml"), "utf8");
  for (const p of ["/", "/vi", "/projects/vhrm", "/vi/projects/vhrm", "/resume"]) assert.ok(sitemap.includes(`<loc>${url}${p}</loc>`), `sitemap: ${p}`);
  for (const page of ["index.html", "about.html", "projects.html", "resume.html", "projects/vhrm.html", "vi.html", "vi/about.html", "vi/projects.html", "vi/resume.html", "vi/projects/vhrm.html"])
    assert.match(fs.readFileSync(path.join(out, page), "utf8"), new RegExp(`property="og:image" content="${url}/`), `${page}: og:image`);
  assert.match(fs.readFileSync(path.join(out, "robots.txt"), "utf8"), new RegExp(`Sitemap: ${url}/sitemap.xml`));
  const about = fs.readFileSync(path.join(out, "vi/about.html"), "utf8");
  assert.match(about, new RegExp(`<link rel="canonical" href="${url}/vi/about"`));
  assert.match(about, new RegExp(`hrefLang="en-US" href="${url}/about"`));
  assert.match(about, new RegExp(`property="og:image" content="${url}/vi/opengraph-image`));

  const headers = fs.readFileSync(path.join(out, "_headers"), "utf8");
  const ogFiles = walk(out).filter((f) => path.basename(f).startsWith("opengraph-image") && !path.extname(f));
  assert.ok(ogFiles.length >= 16, "site + per-project OG images in both languages");
  for (const f of ogFiles) {
    const route = `/${path.relative(out, f).split(path.sep).join("/")}`;
    assert.ok(headers.includes(`${route}\n  Content-Type: image/png`), `missing PNG header for ${route}`);
  }
});

test("the GitHub heatmap renders on both About pages", { skip }, () => {
  const content = loadContent(process.cwd());
  const section = content.site.sections.find((s) => s.id === "github");
  const data = path.join(process.cwd(), "src/data/github-contributions.json");
  if (!section?.visible || !fs.existsSync(data)) return;
  const { total } = JSON.parse(fs.readFileSync(data, "utf8"));
  // The total is asserted inside its own sentence, per language: a bare "629" would also match a
  // build hash, and an absent id makes indexOf return -1, which would order itself first for free.
  const expected = {
    "about.html": `${total} contributions in the last 12 months`,
    "vi/about.html": `${total} đóng góp trong 12 tháng qua`,
  };
  // Per-day tooltips follow each language's house date convention: month name in English
  // (like "Aug 2025" elsewhere), numeric in Vietnamese (like "08/2025"). Matched as a shape, not a
  // fixed day — the 12-month window slides, so any named date would expire.
  const tooltip = { "about.html": /on [A-Z][a-z]{2} \d{1,2}, \d{4}/, "vi/about.html": /ngày \d{2}\/\d{2}\/\d{4}/ };
  for (const [page, sentence] of Object.entries(expected)) {
    const html = fs.readFileSync(path.join(out, page), "utf8");
    const heatmap = html.indexOf('id="github"');
    const skillset = html.indexOf('id="expertise"');
    assert.ok(heatmap >= 0, `${page}: không thấy section heatmap`);
    assert.ok(skillset >= 0, `${page}: không thấy section Skillset`);
    assert.ok(heatmap < skillset, `${page}: heatmap phải nằm trước Skillset`);
    assert.ok(html.includes(sentence), `${page}: thiếu câu tổng đúng ngôn ngữ — "${sentence}"`);
    assert.match(html, tooltip[page as keyof typeof tooltip], `${page}: tooltip sai quy ước ngày của ngôn ngữ này`);
  }
});
