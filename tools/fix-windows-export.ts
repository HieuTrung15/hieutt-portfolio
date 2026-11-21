// shortcut: works around Next.js 16 writing per-segment prefetch files with a Windows path separator
// (out/x/__next.a/b.txt instead of out/x/__next.a.b.txt), which makes client prefetches 404.
// No-op when the output is already flat (Linux/macOS builds). Remove once Next.js fixes it upstream.
import fs from "node:fs";
import path from "node:path";

const out = path.resolve("out");
let moved = 0;

function flatten(dir: string, prefix: string, target: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const name = `${prefix}.${entry.name}`;
    const from = path.join(dir, entry.name);
    if (entry.isDirectory()) flatten(from, name, target);
    else {
      fs.renameSync(from, path.join(target, name));
      moved++;
    }
  }
  fs.rmdirSync(dir);
}

function walk(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "_next") continue;
    const full = path.join(dir, entry.name);
    if (entry.name.startsWith("__next.")) flatten(full, entry.name, dir);
    else walk(full);
  }
}

if (fs.existsSync(out)) walk(out);
if (moved) console.log(`fix-windows-export: flattened ${moved} prefetch file(s)`);
