import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { activeDays, loadGithubContributions, readContributionsFile } from "../src/lib/github/data.ts";
import { githubUsernameFrom, leadingBlanks, parseContributions } from "../src/lib/github/parse.ts";

const fixture = fs.readFileSync(path.join(process.cwd(), "tests/fixtures/github-contributions.html"), "utf8");

const DATA_PATH = path.join(process.cwd(), "src/data/github-contributions.json");
const dataSkip = fs.existsSync(DATA_PATH) ? false : "src/data/github-contributions.json chưa có — chạy `pnpm sync:github`";

test("reads the headline total and every day cell", () => {
  const r = parseContributions(fixture);
  assert.ok(r);
  assert.equal(r.headlineTotal, 42);
  assert.equal(r.days.length, 4);
});

test("the headline total is reported separately from the days, never merged into them", () => {
  const r = parseContributions(fixture)!;
  assert.equal(
    r.days.reduce((s, d) => s + d.count, 0),
    13,
    "fixture cố ý để 42 ≠ 13",
  );
  assert.equal(r.headlineTotal, 42, "parser không được 'sửa' số liệu cho khớp nhau");
});

test("markup without the headline total still yields its days", () => {
  const r = parseContributions(fixture.replace(/<h2[\s\S]*?<\/h2>/, ""));
  assert.ok(r, "mất <h2> không được làm chết parser");
  assert.equal(r.headlineTotal, null);
  assert.equal(r.days.length, 4);
});

test("sorts days chronologically, not in GitHub's row-major document order", () => {
  const r = parseContributions(fixture);
  assert.deepEqual(
    r!.days.map((d) => d.date),
    ["2025-11-23", "2025-11-24", "2025-11-25", "2025-11-30"],
  );
});

test("reads exact counts from tool-tips and keeps levels", () => {
  const byDate = new Map(parseContributions(fixture)!.days.map((d) => [d.date, d]));
  assert.deepEqual(byDate.get("2025-11-30"), { date: "2025-11-30", count: 9, level: 3 });
  assert.deepEqual(byDate.get("2025-11-23"), { date: "2025-11-23", count: 0, level: 0 });
});

test("a day whose tool-tip is missing gets count 0, never NaN", () => {
  const day = parseContributions(fixture)!.days.find((d) => d.date === "2025-11-25");
  assert.deepEqual(day, { date: "2025-11-25", count: 0, level: 1 });
});

test("ignores legend swatches that carry data-level but are not day cells", () => {
  assert.ok(!parseContributions(fixture)!.days.some((d) => d.level === 4));
});

test("returns null when there are no day cells at all", () => {
  for (const bad of ["", "<html><body>nope</body></html>", '<h2 id="js-contribution-activity-description">0 contributions</h2>'])
    assert.equal(parseContributions(bad), null);
});

test("githubUsernameFrom accepts profile URLs and rejects everything else", () => {
  assert.equal(githubUsernameFrom("https://github.com/HieuTrung15"), "HieuTrung15");
  assert.equal(githubUsernameFrom("https://github.com/HieuTrung15/"), "HieuTrung15");
  for (const bad of ["", "   ", "https://github.com/", "https://github.com/a/b", "https://gitlab.com/x", "https://github.com/-bad-"])
    assert.equal(githubUsernameFrom(bad), null, bad);
});

test("leadingBlanks aligns the first column to the weekday grid", () => {
  assert.equal(leadingBlanks("2025-11-23"), 0, "Chủ nhật — không cần ô trống");
  assert.equal(leadingBlanks("2025-11-24"), 1, "Thứ hai — chèn 1 ô");
  assert.equal(leadingBlanks("2025-11-29"), 6, "Thứ bảy — chèn 6 ô");
});

test("the committed data file is a well-formed year of contributions", { skip: dataSkip }, () => {
  const d = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  assert.ok(d.days.length >= 300, `chỉ có ${d.days.length} ngày`);
  assert.equal(d.days[0].date, d.from);
  assert.equal(d.days.at(-1).date, d.to);
  assert.ok(d.days.every((x: { level: number }) => Number.isInteger(x.level) && x.level >= 0 && x.level <= 4));
  assert.ok(d.days.every((x: { count: number }) => Number.isInteger(x.count) && x.count >= 0));
  assert.deepEqual([...d.days].sort((a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date)), d.days);
  assert.equal(new Date(d.from).getUTCDay(), 0, "lịch GitHub luôn bắt đầu Chủ nhật");
  assert.equal(d.username, "HieuTrung15");
});

test("activeDays counts only days with contributions", () => {
  const year = { days: [{ date: "a", count: 0, level: 0 }, { date: "b", count: 3, level: 2 }] };
  assert.equal(activeDays(year as never), 1);
});

test("a missing or unreadable data file yields null, never a throw", () => {
  assert.equal(readContributionsFile(path.join(process.cwd(), "src/data/does-not-exist.json")), null);
  assert.equal(readContributionsFile(path.join(process.cwd(), "package.json")), null, "JSON hợp lệ nhưng sai shape");
});

test("the real data file loads and matches its own summary", { skip: dataSkip }, () => {
  const year = loadGithubContributions();
  assert.ok(year);
  assert.equal(
    year.total,
    year.days.reduce((s, d) => s + d.count, 0),
  );
  assert.ok(activeDays(year) > 0 && activeDays(year) <= year.days.length);
});
