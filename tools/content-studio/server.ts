// HieuTT Content Studio — local-only editor for content/. Run with `pnpm studio`.
// Never part of the production build: it lives outside src/ and the site is a static export.
//
// Security model (local dev tool):
//  - binds to 127.0.0.1 only and rejects other Host headers (DNS rebinding);
//  - every /api call needs the per-session token embedded in the served page, sent as a custom
//    header, so other websites open in the same browser cannot call it (no CORS is ever allowed);
//  - files are only written to paths derived from validated slugs inside content/ and public/;
//  - content is fully validated (schema + cross-references) before anything is written;
//  - every overwritten or deleted file is copied to .studio-backups/<timestamp>/ first.
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Markdown from "react-markdown";
import { z } from "zod";

import { CONTENT_DIR, listContentFiles, readRawContent, serializeContent, validateContent } from "../../src/lib/content/load.ts";
import { ProjectSchema, SINGLETONS, type RawContent } from "../../src/lib/content/schema.ts";
import { markdownProps } from "../../src/lib/markdown.ts";

const STUDIO_DIR = path.dirname(fileURLToPath(import.meta.url));
const STATIC: Record<string, [file: string, type: string]> = {
  "/app.js": ["app.js", "text/javascript; charset=utf-8"],
  "/studio.css": ["studio.css", "text/css; charset=utf-8"],
};
const MAX_JSON = 2 * 1024 * 1024;
const MAX_UPLOAD = 10 * 1024 * 1024;
const UPLOADS = {
  image: { dir: "uploads", ext: [".png", ".jpg", ".jpeg", ".webp"] },
  pdf: { dir: "cv", ext: [".pdf"] },
} as const;
// Magic numbers so a renamed file cannot slip through as an image/PDF.
const SIGNATURES: Record<string, (b: Buffer) => boolean> = {
  ".png": (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  ".jpg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  ".jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  ".webp": (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP",
  ".pdf": (b) => b.subarray(0, 5).toString() === "%PDF-",
};

class HttpError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body ?? { error: message };
  }
}

const normalizeEol = (s: string) => s.replace(/\r\n/g, "\n");

/** Hash of every content file on disk; the Studio sends it back on save to detect outside edits. */
export function contentVersion(root: string) {
  const hash = crypto.createHash("sha256");
  for (const rel of listContentFiles(root)) hash.update(rel).update(normalizeEol(fs.readFileSync(path.join(root, CONTENT_DIR, rel), "utf8")));
  return hash.digest("hex").slice(0, 16);
}

/** Resolves a path and refuses anything that escapes `base` (path traversal guard). */
export function inside(base: string, rel: string) {
  const abs = path.resolve(base, rel);
  if (!abs.startsWith(path.resolve(base) + path.sep)) throw new HttpError(400, `Đường dẫn không hợp lệ: ${rel}`);
  return abs;
}

/** Writes only changed files (backing up what it replaces) and removes files no longer in content. */
export function writeContent(root: string, raw: RawContent) {
  const dir = path.join(root, CONTENT_DIR);
  const next = serializeContent(raw);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = (rel: string) => {
    const dst = inside(path.join(root, ".studio-backups", stamp), rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(inside(dir, rel), dst);
  };
  const written: string[] = [];
  const removed: string[] = [];
  for (const [rel, text] of next) {
    const abs = inside(dir, rel);
    const exists = fs.existsSync(abs);
    if (exists && normalizeEol(fs.readFileSync(abs, "utf8")) === text) continue;
    if (exists) backup(rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(`${abs}.tmp`, text);
    fs.renameSync(`${abs}.tmp`, abs);
    written.push(rel);
  }
  for (const rel of listContentFiles(root)) {
    if (next.has(rel)) continue;
    backup(rel);
    fs.rmSync(inside(dir, rel));
    removed.push(rel);
  }
  return { written, removed };
}

export function jsonSchemas() {
  const toJson = (schema: z.ZodType) => z.toJSONSchema(schema, { io: "input", unrepresentable: "any" });
  return {
    ...Object.fromEntries(Object.entries(SINGLETONS).map(([key, { schema }]) => [key, toJson(schema)])),
    project: toJson(ProjectSchema),
  };
}

export function renderMarkdown(markdown: string) {
  return renderToStaticMarkup(createElement(Markdown, markdownProps, markdown));
}

function saveUpload(root: string, kind: string, name: string, data: Buffer) {
  const rule = UPLOADS[kind as keyof typeof UPLOADS];
  if (!rule) throw new HttpError(400, "Loại file không hỗ trợ");
  const ext = path.extname(name).toLowerCase();
  if (!(rule.ext as readonly string[]).includes(ext)) throw new HttpError(400, `Chỉ chấp nhận: ${rule.ext.join(", ")}`);
  if (!SIGNATURES[ext](data)) throw new HttpError(400, "Nội dung file không khớp với định dạng");
  const base =
    path
      .basename(name, path.extname(name))
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/gi, "d")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "file";
  const dir = path.join(root, "public", rule.dir);
  fs.mkdirSync(dir, { recursive: true });
  let file = `${base}${ext}`;
  for (let i = 1; fs.existsSync(path.join(dir, file)); i++) file = `${base}-${i}${ext}`;
  fs.writeFileSync(inside(dir, file), data);
  return `/${rule.dir}/${file}`;
}

async function readBody(req: http.IncomingMessage, limit: number) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > limit) throw new HttpError(413, "Dữ liệu quá lớn");
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
}

async function readJson(req: http.IncomingMessage) {
  try {
    return JSON.parse((await readBody(req, MAX_JSON)).toString("utf8"));
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(400, "JSON không hợp lệ");
  }
}

const isRawContent = (v: unknown): v is RawContent =>
  !!v && typeof v === "object" && typeof (v as RawContent).projects === "object" && typeof (v as RawContent).caseStudies === "object";

export function createStudio({ root, token = crypto.randomBytes(24).toString("hex") }: { root: string; token?: string }) {
  const tokenBuf = Buffer.from(token);
  const send = (res: http.ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) => {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    });
    res.end(JSON.stringify(body));
  };

  const server = http.createServer(async (req, res) => {
    try {
      const port = (server.address() as { port: number }).port;
      if (![`127.0.0.1:${port}`, `localhost:${port}`].includes(req.headers.host ?? "")) throw new HttpError(403, "Host không được phép");
      const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);

      if (req.method === "GET" && url.pathname === "/") {
        const html = fs.readFileSync(path.join(STUDIO_DIR, "index.html"), "utf8").replace("__STUDIO_TOKEN__", token);
        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Frame-Options": "DENY",
          "Content-Security-Policy":
            "default-src 'self'; img-src 'self' data: http://127.0.0.1:3000 http://localhost:3000; frame-src http://127.0.0.1:3000 http://localhost:3000; style-src 'self'; script-src 'self'; frame-ancestors 'none'",
        });
        return res.end(html);
      }
      if (req.method === "GET" && STATIC[url.pathname]) {
        const [file, type] = STATIC[url.pathname];
        res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
        return res.end(fs.readFileSync(path.join(STUDIO_DIR, file)));
      }
      if (req.method === "GET" && url.pathname.startsWith("/media/")) {
        // Lets the Studio show thumbnails of files in public/ without the dev site running.
        const file = inside(path.join(root, "public"), decodeURIComponent(url.pathname.slice("/media/".length)));
        const type = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" }[path.extname(file).toLowerCase()];
        if (!type || !fs.existsSync(file)) throw new HttpError(404, "Không tìm thấy");
        res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
        return res.end(fs.readFileSync(file));
      }
      if (!url.pathname.startsWith("/api/")) throw new HttpError(404, "Không tìm thấy");

      const given = Buffer.from(String(req.headers["x-studio-token"] ?? ""));
      if (given.length !== tokenBuf.length || !crypto.timingSafeEqual(given, tokenBuf)) throw new HttpError(401, "Thiếu hoặc sai token của Studio");

      const route = `${req.method} ${url.pathname}`;
      if (route === "GET /api/content")
        return send(res, 200, { content: readRawContent(root), version: contentVersion(root), schemas: jsonSchemas() });

      if (route === "POST /api/validate") {
        const { content } = await readJson(req);
        if (!isRawContent(content)) throw new HttpError(400, "Thiếu dữ liệu content");
        const { ok, errors, warnings } = validateContent(content);
        return send(res, 200, { ok, errors, warnings });
      }

      if (route === "PUT /api/content") {
        const { content, version } = await readJson(req);
        if (!isRawContent(content)) throw new HttpError(400, "Thiếu dữ liệu content");
        if (version !== contentVersion(root))
          throw new HttpError(409, "File nội dung đã bị thay đổi bên ngoài Studio. Tải lại để lấy bản mới nhất.");
        const result = validateContent(content);
        if (!result.ok)
          throw new HttpError(422, "Nội dung không hợp lệ", { error: "Nội dung không hợp lệ", errors: result.errors, warnings: result.warnings });
        const changes = writeContent(root, content);
        return send(res, 200, { ok: true, ...changes, warnings: result.warnings, version: contentVersion(root) });
      }

      if (route === "POST /api/preview") {
        const { markdown } = await readJson(req);
        if (typeof markdown !== "string") throw new HttpError(400, "Thiếu markdown");
        return send(res, 200, { html: renderMarkdown(markdown) });
      }

      if (route === "POST /api/upload") {
        const data = await readBody(req, MAX_UPLOAD);
        return send(res, 200, { path: saveUpload(root, url.searchParams.get("kind") ?? "", url.searchParams.get("name") ?? "", data) });
      }

      if (route === "GET /api/export") {
        const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
        return send(res, 200, { exportedAt: new Date().toISOString(), content: readRawContent(root) }, {
          "Content-Disposition": `attachment; filename="portfolio-content-${stamp}.json"`,
        });
      }

      throw new HttpError(404, "Không tìm thấy API");
    } catch (e) {
      if (e instanceof HttpError) return send(res, e.status, e.body);
      console.error(e);
      send(res, 500, { error: (e as Error).message });
    }
  });
  return { server, token };
}

// CLI entry: `node tools/content-studio/server.ts [--no-site] [--port 4321]`
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // realpath.native fixes drive-letter casing on Windows (d:\ vs D:\), which otherwise loads React twice in Next.
  const root = fs.realpathSync.native(path.resolve(STUDIO_DIR, "../.."));
  const portArg = process.argv.indexOf("--port");
  const port = portArg > 0 ? Number(process.argv[portArg + 1]) : 4321;
  const { server } = createStudio({ root });
  server.listen(port, "127.0.0.1", () => {
    console.log(`\n  HieuTT Content Studio → http://127.0.0.1:${port}\n`);
  });
  if (!process.argv.includes("--no-site")) {
    const site = spawn(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "dev", "-H", "127.0.0.1", "-p", "3000"], {
      cwd: root,
      stdio: "inherit",
    });
    const stop = () => {
      site.kill();
      process.exit(0);
    };
    process.on("SIGINT", stop);
    process.on("SIGTERM", stop);
  }
}
