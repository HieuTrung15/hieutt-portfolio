// Serves the static export in out/ like a typical static host ("/about" -> about.html). Local use only.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import zlib from "node:zlib";

const root = path.resolve("out");
const port = Number(process.env.PORT ?? 4173);
const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml", ".pdf": "application/pdf", ".ico": "image/x-icon",
};

if (!fs.existsSync(root)) {
  console.error("out/ not found — run `pnpm build` first.");
  process.exit(1);
}

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
    const candidates = [urlPath, `${urlPath}.html`, path.join(urlPath, "index.html")].map((p) => path.join(root, p));
    const file = candidates.find((f) => f.startsWith(root + path.sep) && fs.existsSync(f) && fs.statSync(f).isFile());
    const target = file ?? path.join(root, "404.html");
    // Next writes OG images without an extension.
    const type = path.basename(target).startsWith("opengraph-image") && !path.extname(target) ? "image/png" : (types[path.extname(target)] ?? "application/octet-stream");
    // Compress text like any real static host would, so local Lighthouse numbers are realistic.
    const gzip = /text|javascript|json|xml|svg/.test(type) && /gzip/.test(String(req.headers["accept-encoding"]));
    res.writeHead(file ? 200 : 404, { "Content-Type": type, ...(gzip && { "Content-Encoding": "gzip" }) });
    const stream = fs.createReadStream(target);
    (gzip ? stream.pipe(zlib.createGzip()) : stream).pipe(res);
  })
  .listen(port, "127.0.0.1", () => console.log(`Preview: http://127.0.0.1:${port}`));
