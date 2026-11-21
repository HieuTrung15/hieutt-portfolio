import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";

import { isVisible } from "../src/lib/content/derive.ts";
import { loadContent } from "../src/lib/content/load.ts";
import { createStudio, inside, renderMarkdown } from "../tools/content-studio/server.ts";

// The Studio works on a throwaway copy of content/, never the real files.
const root = fs.mkdtempSync(path.join(os.tmpdir(), "studio-test-"));
fs.cpSync(path.join(process.cwd(), "content"), path.join(root, "content"), { recursive: true });
const { server, token } = createStudio({ root, token: "test-token" });
let base = "";

before(async () => {
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => {
  server.close();
  fs.rmSync(root, { recursive: true, force: true });
});

const call = (method: string, url: string, body?: unknown, headers: Record<string, string> = { "x-studio-token": token }) =>
  fetch(base + url, {
    method,
    headers: { ...headers, ...(body !== undefined && !(body instanceof Uint8Array) ? { "Content-Type": "application/json" } : {}) },
    body: body === undefined ? undefined : body instanceof Uint8Array ? new Blob([body as Uint8Array<ArrayBuffer>]) : JSON.stringify(body),
  });
type Loaded = {
  content: { profile: Record<string, unknown>; projects: Record<string, Record<string, unknown>>; caseStudies: Record<string, Record<string, string>> };
  version: string;
  schemas: { project: { properties: { status: { enum: string[] } } } };
};
const getContent = async () => (await (await call("GET", "/api/content")).json()) as Loaded;
const readFile = (rel: string) => fs.readFileSync(path.join(root, "content", rel), "utf8");

test("rejects calls without the session token", async () => {
  assert.equal((await call("GET", "/api/content", undefined, {})).status, 401);
  assert.equal((await call("GET", "/api/content", undefined, { "x-studio-token": "wrong-token" })).status, 401);
});

test("rejects foreign Host headers (DNS rebinding)", async () => {
  const status = await new Promise<number>((resolve, reject) => {
    const url = new URL(base);
    http
      .get({ host: url.hostname, port: url.port, path: "/api/content", headers: { Host: "evil.example", "x-studio-token": token } }, (res) => resolve(res.statusCode!))
      .on("error", reject);
  });
  assert.equal(status, 403);
});

test("serves the editor with a CSP and the session token", async () => {
  const res = await call("GET", "/", undefined, {});
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.match(await res.text(), /content="test-token"/);
});

test("loads content and form schemas", async () => {
  const { content, schemas } = await getContent();
  assert.equal(Object.keys(content.projects).length, 7);
  assert.equal(schemas.project.properties.status.enum.join(), "draft,published");
});

test("invalid content is refused and nothing is written", async () => {
  const before = readFile("profile.json");
  const { content, version } = await getContent();
  content.profile.email = "nope";
  const res = await call("PUT", "/api/content", { content, version });
  assert.equal(res.status, 422);
  assert.ok(((await res.json()) as { errors: string[] }).errors.some((e) => e.includes("profile.json")));
  assert.equal(readFile("profile.json"), before);
});

test("saves edits to files, backs up the old file, and detects outside edits", async () => {
  const { content, version } = await getContent();
  content.profile.location = { en: "Hanoi, Vietnam (test)", vi: "Hà Nội, Việt Nam" };
  const res = await call("PUT", "/api/content", { content, version });
  assert.equal(res.status, 200);
  const body = (await res.json()) as { written: string[]; version: string };
  assert.deepEqual(body.written, ["profile.json"]);
  assert.deepEqual(JSON.parse(readFile("profile.json")).location, { en: "Hanoi, Vietnam (test)", vi: "Hà Nội, Việt Nam" });
  assert.ok(fs.readdirSync(path.join(root, ".studio-backups")).length > 0);

  // Stale version (file changed elsewhere since load) → 409, no overwrite.
  const stale = await call("PUT", "/api/content", { content, version });
  assert.equal(stale.status, 409);
});

test("adds a draft project, then publishes and deletes it", async () => {
  let { content, version } = await getContent();
  content.projects["new-erp"] = { slug: "new-erp", title: "New ERP", status: "draft" };
  content.caseStudies["new-erp"] = { vi: "Bối cảnh **mới**." };
  let res = await call("PUT", "/api/content", { content, version });
  assert.equal(res.status, 200);
  assert.ok(fs.existsSync(path.join(root, "content/projects/new-erp.json")));
  assert.ok(fs.existsSync(path.join(root, "content/case-studies/new-erp.vi.md")));
  const draft = loadContent(root).projects.find((p) => p.slug === "new-erp")!;
  assert.equal(isVisible(draft, false), false, "draft stays out of production");

  ({ content, version } = await getContent());
  content.projects["new-erp"].status = "published";
  assert.equal((await call("PUT", "/api/content", { content, version })).status, 422, "published needs a summary");
  content.projects["new-erp"].summary = { en: "Summary." };
  res = await call("PUT", "/api/content", { content, version });
  assert.equal(res.status, 200);
  const saved = (await res.json()) as { warnings: string[] };
  assert.ok(saved.warnings.some((w) => w.includes("new-erp") && w.includes('"vi"')), "missing translation is reported");

  ({ content, version } = await getContent());
  delete content.projects["new-erp"];
  delete content.caseStudies["new-erp"];
  res = await call("PUT", "/api/content", { content, version });
  assert.deepEqual(((await res.json()) as { removed: string[] }).removed.sort(), ["case-studies/new-erp.vi.md", "projects/new-erp.json"]);
  assert.ok(!fs.existsSync(path.join(root, "content/projects/new-erp.json")));
});

test("refuses project keys that could escape content/", async () => {
  const { content, version } = await getContent();
  content.projects["../../evil"] = { slug: "../../evil", title: "x", status: "draft" };
  assert.equal((await call("PUT", "/api/content", { content, version })).status, 422);
  assert.throws(() => inside(path.join(root, "content"), "../package.json"));
});

test("uploads only real images/PDFs with sanitized names", async () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const ok = await call("POST", `/api/upload?kind=image&name=${encodeURIComponent("../../Ảnh Đại Diện.PNG")}`, png);
  assert.equal(ok.status, 200);
  const { path: saved } = (await ok.json()) as { path: string };
  assert.equal(saved, "/uploads/anh-dai-dien.png");
  assert.ok(fs.existsSync(path.join(root, "public/uploads/anh-dai-dien.png")));

  const fake = await call("POST", "/api/upload?kind=image&name=x.png", new TextEncoder().encode("<svg onload=alert(1)>"));
  assert.equal(fake.status, 400);
  const svg = await call("POST", "/api/upload?kind=image&name=x.svg", png);
  assert.equal(svg.status, 400);
});

test("markdown preview drops raw HTML", () => {
  const html = renderMarkdown("**ok** <script>alert(1)</script> <img src=x onerror=alert(1)>");
  assert.match(html, /<strong>ok<\/strong>/);
  assert.doesNotMatch(html, /<script|onerror/);
});
