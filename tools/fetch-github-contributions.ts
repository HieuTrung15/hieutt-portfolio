// Refreshes src/data/github-contributions.json from the public GitHub contribution calendar.
// Run by `pnpm sync:github`, by `pnpm deploy:cloudflare`, and by CI before `pnpm build`.
// Deliberately NOT part of `pnpm build`: builds stay deterministic, work offline, and never
// rewrite a committed file.
//
// This script never exits non-zero. GitHub being slow, unreachable or restyled must not turn a
// deploy red — every failure keeps the file that is already there and says why in the log.
import fs from "node:fs";
import path from "node:path";

import { githubUsernameFrom, MIN_DAYS, parseContributions, type ContributionYear } from "../src/lib/github/parse.ts";

const OUT = path.resolve("src/data/github-contributions.json");
const SOCIAL_LINKS = path.resolve("content/social-links.json");
const TIMEOUT_MS = 15_000;
const LOG = "fetch-github-contributions";

const relative = (file: string) => path.relative(process.cwd(), file).split(path.sep).join("/");

/** Abandons the refresh without failing the run. */
function keepExisting(reason: string) {
  const kept = fs.existsSync(OUT) ? `giữ nguyên ${relative(OUT)}` : "chưa có dữ liệu nào để dùng, heatmap sẽ bị ẩn";
  console.warn(`${LOG}: ${reason}. ${kept}.`);
}

/** The GitHub profile URL the site already advertises — one source of truth, no new config field. */
function profileUrl(): string | null {
  try {
    const links: { icon?: string; url?: string }[] = JSON.parse(fs.readFileSync(SOCIAL_LINKS, "utf8"));
    return links.find((l) => l.icon === "github")?.url?.trim() || null;
  } catch (e) {
    console.warn(`${LOG}: không đọc được content/social-links.json: ${(e as Error).message}`);
    return null;
  }
}

/** One day per line: the file is committed, and a 368-entry array indented wholesale is unreadable in a diff. */
function serialize(year: ContributionYear): string {
  const head = (["username", "profileUrl", "total", "from", "to", "fetchedAt"] as const).map(
    (k) => `  ${JSON.stringify(k)}: ${JSON.stringify(year[k])}`,
  );
  const days = year.days.map((d) => `    ${JSON.stringify(d)}`);
  return `{\n${head.join(",\n")},\n  "days": [\n${days.join(",\n")}\n  ]\n}\n`;
}

async function sync() {
  const url = profileUrl();
  const username = url && githubUsernameFrom(url);
  if (!username) return keepExisting(`content/social-links.json không có URL hồ sơ GitHub hợp lệ (đang là ${JSON.stringify(url ?? "")})`);

  let html: string;
  try {
    const res = await fetch(`https://github.com/users/${username}/contributions`, {
      headers: { accept: "text/html" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return keepExisting(`GitHub trả HTTP ${res.status}`);
    html = await res.text();
  } catch (e) {
    return keepExisting(`không gọi được GitHub: ${(e as Error).message}`);
  }

  const parsed = parseContributions(html);
  if (!parsed) return keepExisting("không đọc được ô ngày nào — nhiều khả năng GitHub đã đổi markup");
  if (parsed.days.length < MIN_DAYS)
    return keepExisting(`chỉ đọc được ${parsed.days.length} ngày, cần ít nhất ${MIN_DAYS} — nhiều khả năng GitHub đã đổi markup`);

  // The drawn grid is the authority: a total that disagreed with it would be a number no visitor
  // could verify by counting. GitHub's own headline figure is only a cross-check.
  const total = parsed.days.reduce((sum, d) => sum + d.count, 0);
  if (parsed.headlineTotal !== null && parsed.headlineTotal !== total)
    console.warn(`${LOG}: GitHub ghi ${parsed.headlineTotal} nhưng tổng các ô là ${total}; dùng ${total}`);

  const year: ContributionYear = {
    username,
    profileUrl: url.replace(/\/+$/, ""),
    total,
    from: parsed.days[0].date,
    to: parsed.days[parsed.days.length - 1].date,
    fetchedAt: new Date().toISOString(),
    days: parsed.days,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, serialize(year));
  console.log(`${LOG}: ${total} contributions, ${year.days.length} ngày (${year.from} → ${year.to}) → ${relative(OUT)}`);
}

await sync();
