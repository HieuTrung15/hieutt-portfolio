// Writes out/_headers for Cloudflare Pages (run after `next build`):
//  - Next writes Open Graph images without a file extension, so Pages would serve them as
//    application/octet-stream and social previews would break; each one gets an explicit PNG type.
//  - Hashed build assets are cached for a year; every page gets basic security headers.
import fs from "node:fs";
import path from "node:path";

const out = path.resolve("out");
const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));

const ogImages = walk(out)
  .filter((f) => path.basename(f).startsWith("opengraph-image") && !path.extname(f))
  .map((f) => `/${path.relative(out, f).split(path.sep).join("/")}`)
  .sort();

const lines = [
  "/*",
  "  X-Content-Type-Options: nosniff",
  "  Referrer-Policy: strict-origin-when-cross-origin",
  "  X-Frame-Options: DENY",
  "  Permissions-Policy: camera=(), microphone=(), geolocation=()",
  "",
  "/_next/static/*",
  "  Cache-Control: public, max-age=31536000, immutable",
  ...ogImages.flatMap((p) => ["", p, "  Content-Type: image/png"]),
];
fs.writeFileSync(path.join(out, "_headers"), `${lines.join("\n")}\n`);
console.log(`cloudflare-headers: wrote out/_headers (${ogImages.length} Open Graph images)`);
