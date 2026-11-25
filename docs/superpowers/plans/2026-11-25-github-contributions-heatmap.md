# GitHub Contributions Heatmap — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hiển thị heatmap đóng góp GitHub 12 tháng gần nhất trên `/about`, ngay trước section "Professional Skillset", dựng hoàn toàn lúc build.

**Architecture:** Một script Node đọc HTML trang profile GitHub công khai và ghi `src/data/github-contributions.json`. Một server component đọc file đó lúc build và render lưới tĩnh — không có JS phía client, không gọi mạng từ trình duyệt người xem. Script không bao giờ làm build đỏ: lỗi thì giữ nguyên file cũ.

**Tech Stack:** Next.js 16.4.6 (static export), React 19.3, TypeScript 6, Tailwind v4, Zod 4, `node --test`. Không thêm dependency npm.

**Spec:** [docs/superpowers/specs/2026-11-25-github-contributions-heatmap-design.md](../specs/2026-11-25-github-contributions-heatmap-design.md)

## Global Constraints

- **KHÔNG commit.** Người dùng tự commit và push. Mỗi task kết thúc bằng bước verify, không phải `git commit`.
- Không thêm dependency npm. Parse HTML bằng regex thuần.
- Không thêm secret/token vào CI.
- `pnpm build` không được fetch mạng và không được sửa file đã commit.
- Script `tools/fetch-github-contributions.ts` **luôn exit 0**, kể cả khi thất bại.
- `tsconfig`: `erasableSyntaxOnly: true` (không dùng `enum`, không parameter property), `verbatimModuleSyntax` (dùng `import type`), import nội bộ trong `src/lib` và `tools` ghi kèm đuôi `.ts`; component dùng alias `@/` không đuôi.
- Song ngữ: mọi chuỗi UI mới phải có cả `en` và `vi` trong `src/lib/i18n.ts` (TypeScript ép `vi` khớp shape của `en`).
- Hai theme: mọi token màu mới định nghĩa ở cả `:root` và `.dark` trong `src/app/globals.css`.
- Giá trị đã xác minh ngày 2026-11-25: total **629**, **368** ngày, từ **2025-11-23** (Chủ nhật) đến **2026-11-25** (Thứ tư), **125** ngày có hoạt động, **53** cột.
- Chạy test: `pnpm test` (`node --test "tests/*.test.ts"`). Typecheck: `pnpm typecheck`. Lint: `pnpm lint`.

## Review Focus

1. **HTML của GitHub xếp theo hàng ngang, không theo thời gian** — `<td>` thứ 0,1,2 là 2025-11-23, 2025-11-30, 2025-12-07 (cách nhau 7 ngày). Parser phải sort theo ngày, nếu không lưới sẽ sai hoàn toàn. → Task 1.
2. **Legend "Less/More" cũng mang `data-level`** — có 373 phần tử `data-level` nhưng chỉ 368 ô ngày. Parser phải lọc theo `class="ContributionCalendar-day"` + có `data-date`. → Task 1.
3. **Thiếu file dữ liệu** (clone mới, chưa chạy sync) — loader phải trả `null` và `/about` vẫn build bình thường, không có section, không lỗi. → Task 3 (`readContributionsFile` nhận đường dẫn, test được với file không tồn tại).
4. **Ngày không bắt đầu từ Chủ nhật** — nếu GitHub đổi, lưới phải vẫn đúng 7 hàng thay vì lệch cột. → Task 1 (`leadingBlanks`, hàm thuần, có test riêng) dùng bởi Task 4.
5. **Tooltip thiếu hoặc không khớp id** — `count` phải về 0 chứ không `NaN`, và `level` vẫn dùng được để tô màu. → Task 1.

---

### Task 1: Parser HTML

**Files:**
- Create: `src/lib/github/parse.ts`
- Create: `tests/fixtures/github-contributions.html`
- Test: `tests/github-contributions.test.ts`

**Interfaces:**
- Consumes: (không có)
- Produces:
  ```ts
  export type ContributionDay = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };
  export type ContributionYear = {
    username: string; profileUrl: string; total: number;
    from: string; to: string; fetchedAt: string; days: ContributionDay[];
  };
  export const MIN_DAYS = 300;
  /** `headlineTotal` là con số ở <h2> — CHỈ để đối chiếu. Tổng thật do script tính từ `days`. */
  export function parseContributions(html: string): { headlineTotal: number | null; days: ContributionDay[] } | null;
  export function leadingBlanks(firstDate: string): number;      // số ô trống cần chèn để cột đầu thẳng hàng
  export function githubUsernameFrom(url: string): string | null; // null nếu rỗng/không hợp lệ
  ```

- [ ] **Step 1: Viết fixture `tests/fixtures/github-contributions.html`**

HTML tối giản mang đúng hình dạng markup thật. Phải chứa: thẻ `<h2 id="js-contribution-activity-description">`; **bốn** ô ngày xếp theo thứ tự hàng ngang (không theo thời gian); một ô không có tool-tip tương ứng; và một phần tử legend mang `data-level` nhưng **không** có class `ContributionCalendar-day`.

```html
<h2 id="js-contribution-activity-description" class="f4 text-normal mb-2">
  42
  contributions
    in the last year
</h2>
<td data-date="2025-11-23" id="c-0-0" data-level="0" data-view-component="true" class="ContributionCalendar-day"></td>
<td data-date="2025-11-30" id="c-0-1" data-level="3" data-view-component="true" class="ContributionCalendar-day"></td>
<td data-date="2025-11-24" id="c-1-0" data-level="2" data-view-component="true" class="ContributionCalendar-day"></td>
<td data-date="2025-11-25" id="c-2-0" data-level="1" data-view-component="true" class="ContributionCalendar-day"></td>
<tool-tip for="c-0-0" class="sr-only">No contributions on November 23rd.</tool-tip>
<tool-tip for="c-0-1" class="sr-only">9 contributions on November 30th.</tool-tip>
<tool-tip for="c-1-0" class="sr-only">4 contributions on November 24th.</tool-tip>
<span data-level="4" class="ContributionCalendar-legend-swatch"></span>
```

- [ ] **Step 2: Viết test thất bại trong `tests/github-contributions.test.ts`**

```ts
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { leadingBlanks, parseContributions } from "../src/lib/github/parse.ts";

const fixture = fs.readFileSync(path.join(process.cwd(), "tests/fixtures/github-contributions.html"), "utf8");

test("reads the headline total and every day cell", () => {
  const r = parseContributions(fixture);
  assert.ok(r);
  assert.equal(r.headlineTotal, 42);
  assert.equal(r.days.length, 4);
});

test("the headline total is reported separately from the days, never merged into them", () => {
  const r = parseContributions(fixture)!;
  assert.equal(r.days.reduce((s, d) => s + d.count, 0), 13, "fixture cố ý để 42 ≠ 13");
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
  assert.deepEqual(r!.days.map((d) => d.date), ["2025-11-23", "2025-11-24", "2025-11-25", "2025-11-30"]);
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
  for (const bad of ["", "<html><body>nope</body></html>", "<h2 id=\"js-contribution-activity-description\">0 contributions</h2>"])
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
```

- [ ] **Step 3: Chạy test, xác nhận FAIL**

Run: `pnpm test`
Expected: FAIL — `Cannot find module '../src/lib/github/parse.ts'`

- [ ] **Step 4: Viết `parseContributions` trong `src/lib/github/parse.ts`**

Ba bước: (1) `headlineTotal` = số đầu tiên trong `<h2 id="js-contribution-activity-description">` (bỏ dấu phẩy ngăn nghìn), `null` nếu không thấy; (2) dựng `Map<string, number>` từ `<tool-tip for="ID">…</tool-tip>` — `"N contributions on …"` → `N`, `"No contributions on …"` → `0`; (3) duyệt mọi thẻ có `class="ContributionCalendar-day"` **và** `data-date`, lấy `date`/`level`/`id`, tra count từ map (thiếu → 0), rồi sort theo `date` tăng dần.

Trả `null` **chỉ khi** `days.length === 0`. Thiếu `<h2>` không phải lỗi — ngày mới là nội dung thật. Không áp `MIN_DAYS` ở đây (fixture chỉ có 4 ngày); ngưỡng đó là việc của script ở Task 2.

`leadingBlanks(firstDate)` = `new Date(firstDate + "T00:00:00Z").getUTCDay()`.

`githubUsernameFrom(url)`: lấy segment cuối của path, trả `null` nếu rỗng, nếu path có nhiều hơn một segment, nếu host không phải `github.com`, hoặc nếu không khớp `^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$`. URL hỏng (ném trong `new URL`) cũng trả `null`.

Cả ba hàm phụ để ở module này vì chúng thuần và cần test được mà không cần render React hay chạm mạng.

- [ ] **Step 5: Chạy test, xác nhận PASS**

Run: `pnpm test`
Expected: PASS, 6 test mới xanh

- [ ] **Step 6: Typecheck**

Run: `pnpm typecheck`
Expected: không có lỗi

---

### Task 2: Script đồng bộ + file dữ liệu

**Files:**
- Create: `tools/fetch-github-contributions.ts`
- Create: `src/data/github-contributions.json` (sinh ra khi chạy script)
- Modify: `package.json` (thêm script `sync:github`)
- Test: `tests/github-contributions.test.ts` (thêm)

**Interfaces:**
- Consumes: `parseContributions`, `githubUsernameFrom`, `MIN_DAYS`, `ContributionYear` từ `src/lib/github/parse.ts`
- Produces: file JSON đúng shape `ContributionYear`; lệnh `pnpm sync:github`

- [ ] **Step 1: Viết test thất bại — bất biến của file dữ liệu thật**

Thêm vào `tests/github-contributions.test.ts`. Test tự bỏ qua khi chưa có file, để clone mới vẫn `pnpm test` xanh. Task này **không** import gì từ Task 3 — nó tự dựng đường dẫn, nên chạy độc lập được:

```ts
const DATA_PATH = path.join(process.cwd(), "src/data/github-contributions.json");
const dataSkip = fs.existsSync(DATA_PATH) ? false : "src/data/github-contributions.json chưa có — chạy `pnpm sync:github`";

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
```

- [ ] **Step 2: Chạy test, xác nhận SKIP**

Run: `pnpm test`
Expected: test mới hiện trạng thái skip với lý do "chưa có — chạy `pnpm sync:github`". Đây là trạng thái đúng: chưa có file thì chưa có gì để kiểm.

- [ ] **Step 3: Viết `tools/fetch-github-contributions.ts`**

Theo đúng style `tools/cloudflare-headers.ts`: top-level code, không main guard, kết thúc bằng một dòng `console.log` tóm tắt.

Trình tự: đọc `content/social-links.json`, tìm mục `icon === "github"`, `githubUsernameFrom(entry.url)` → `fetch("https://github.com/users/<username>/contributions")` với `AbortSignal.timeout(15000)` → `parseContributions()` → ghi `src/data/github-contributions.json` (JSON 2 space, xuống dòng cuối).

Giá trị ghi ra: `total` = **tổng `count` của `days`** (không phải `headlineTotal`); `from`/`to` = ngày đầu/cuối; `fetchedAt` = `new Date().toISOString()`; `profileUrl` = URL lấy từ `social-links.json`.

Khi `headlineTotal !== null && headlineTotal !== total` → `console.warn` nêu cả hai số, rồi **vẫn ghi file**. Đây là cảnh báo đối chiếu, không phải điều kiện chặn.

Mọi nhánh thất bại — không có username hợp lệ, fetch ném lỗi, HTTP ≠ 200, `parseContributions` trả `null`, `days.length < MIN_DAYS` — in `console.warn` nêu rõ lý do, **không ghi đè file cũ**, và kết thúc bình thường. Không `process.exit` với mã khác 0 ở bất kỳ nhánh nào.

- [ ] **Step 4: Thêm script vào `package.json`**

Thêm `sync:github`, và cho `deploy:cloudflare` chạy nó trước. **Không sửa `"build"`** — `build` phải giữ tính tất định và không chạm mạng.

```json
"sync:github": "node tools/fetch-github-contributions.ts",
"deploy:cloudflare": "npm run sync:github && npm run build && npx --yes wrangler@4 pages deploy --branch main"
```

- [ ] **Step 5: Chạy script thật**

Run: `pnpm sync:github`
Expected: in dòng tóm tắt có `629` và `368`; `src/data/github-contributions.json` xuất hiện

- [ ] **Step 6: Xác nhận script không làm hỏng build khi mạng lỗi**

Run: `node -e "process.env.NO_PROXY='';" && pnpm sync:github` với mạng ngắt, **hoặc** tạm sửa URL thành một host không tồn tại rồi chạy lại.
Expected: in cảnh báo, exit code `0` (`echo $?` → `0`), file JSON cũ **không đổi**. Nhớ hoàn nguyên URL sau khi thử.

- [ ] **Step 7: Chạy test, xác nhận PASS**

Run: `pnpm test`
Expected: PASS

---

### Task 3: Loader đọc file lúc build

**Files:**
- Create: `src/lib/github/data.ts`
- Test: `tests/github-contributions.test.ts` (thêm)

**Interfaces:**
- Consumes: `ContributionYear` từ `src/lib/github/parse.ts`
- Produces:
  ```ts
  export const DATA_FILE: string;                                      // đường dẫn tuyệt đối tới src/data/github-contributions.json
  export function readContributionsFile(file: string): ContributionYear | null;  // thuần I/O, nhận path để test được
  export const loadGithubContributions: () => ContributionYear | null; // readContributionsFile(DATA_FILE), bọc cache()
  export function activeDays(year: ContributionYear): number;          // số ngày có count > 0
  ```

- [ ] **Step 1: Viết test thất bại**

```ts
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
  assert.equal(year.total, year.days.reduce((s, d) => s + d.count, 0));
  assert.ok(activeDays(year) > 0 && activeDays(year) <= year.days.length);
});
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `pnpm test`
Expected: FAIL — `activeDays is not a function` / module không tồn tại

- [ ] **Step 3: Viết `src/lib/github/data.ts`**

`DATA_FILE = path.join(process.cwd(), "src/data/github-contributions.json")`.

`readContributionsFile(file)` đọc bằng `fs.readFileSync` trong `try/catch`, **không** dùng `import` JSON — file thiếu thì phải trả `null` lúc chạy chứ không làm hỏng biên dịch. Trả `null` khi: file không tồn tại, JSON hỏng, hoặc `days` không phải mảng không rỗng.

`loadGithubContributions = cache(() => readContributionsFile(DATA_FILE))` — `cache()` của React, giống `src/lib/content/index.ts`.

> Lưu ý: test import module này ngoài môi trường React. `cache()` của React hoạt động bình thường ngoài render (chỉ mất memo hóa), nên không cần xử lý gì thêm.

- [ ] **Step 4: Chạy test, xác nhận PASS**

Run: `pnpm test` và `pnpm typecheck`
Expected: PASS, không lỗi type

---

### Task 4: Component heatmap + màu + chuỗi song ngữ

**Files:**
- Create: `src/components/sections/github-contributions.tsx`
- Modify: `src/app/globals.css` (thêm token `--gh-0..4` ở `:root` và `.dark`)
- Modify: `src/lib/i18n.ts` (thêm khối `github` vào cả `en` và `vi`)

**Interfaces:**
- Consumes: `leadingBlanks` (Task 1); `loadGithubContributions`, `activeDays` (Task 3); `SectionHeading` từ `@/components/accent`; `t`/`Locale` từ `@/lib/i18n`
- Produces:
  ```tsx
  export function GithubContributions({ c, section }:
    { c: Content; section: Content["site"]["sections"][number] }): ReactNode | null;
  ```
  (cùng chữ ký với `Education` và `Expertise`, để `about.tsx` gọi đồng nhất)

- [ ] **Step 1: Thêm chuỗi UI vào `src/lib/i18n.ts`**

Thêm khối `github` vào object `en`, rồi bản `vi` tương ứng (TypeScript sẽ báo lỗi nếu thiếu key):

```ts
github: {
  summary: (total: number, days: number) => `${total} contributions in the last 12 months · ${days} active days`,
  less: "Less",
  more: "More",
  day: (count: number, date: string) =>
    count === 0 ? `No contributions on ${date}` : `${count} contribution${count === 1 ? "" : "s"} on ${date}`,
  viewProfile: "View on GitHub",
  graphLabel: (total: number) => `Contribution graph: ${total} contributions over the last 12 months`,
},
```

Bản `vi`: `` (total, days) => `${total} đóng góp trong 12 tháng qua · ${days} ngày hoạt động` ``, `"Ít"` / `"Nhiều"`, `` (count, date) => count === 0 ? `Không có đóng góp ngày ${date}` : `${count} đóng góp ngày ${date}` ``, `"Xem trên GitHub"`, `` (total) => `Biểu đồ đóng góp: ${total} lượt trong 12 tháng qua` ``.

- [ ] **Step 2: Thêm token màu vào `src/app/globals.css`**

Năm biến ở `:root` (sáng) và `.dark` (tối), đặt ngay sau nhóm `--brand-*` để gần các token liên quan. Dẫn xuất từ `--brand` bằng `color-mix(in oklab, …)` theo đúng cách `--brand-soft` đang làm — heatmap phải thuộc bảng màu của site, không phải màu GitHub dán vào.

Điểm xuất phát (tinh chỉnh bằng mắt sau):

```css
/* :root — nền trắng */
--gh-0: color-mix(in oklab, #000 5%, var(--card));
--gh-1: color-mix(in oklab, var(--brand) 30%, white);
--gh-2: color-mix(in oklab, var(--brand) 55%, white);
--gh-3: color-mix(in oklab, var(--brand) 80%, white);
--gh-4: #08843f;

/* .dark — nền navy */
--gh-0: color-mix(in oklab, #fff 6%, var(--card));
--gh-1: color-mix(in oklab, var(--brand) 25%, var(--card));
--gh-2: color-mix(in oklab, var(--brand) 45%, var(--card));
--gh-3: color-mix(in oklab, var(--brand) 70%, var(--card));
--gh-4: var(--brand);
```

Yêu cầu nghiệm thu: 5 mức phân biệt được bằng mắt ở **cả hai** theme, và `--gh-0` phân biệt được với nền card.

- [ ] **Step 3: Viết component**

Trả `null` ngay khi `loadGithubContributions()` trả `null` hoặc `days` rỗng — section biến mất, không khung rỗng, không thông báo lỗi.

Cấu trúc: `<section id="github" data-section aria-labelledby="github-title">` → `SectionHeading` → `div.glow-card` chứa: câu `summary` (chữ thật), khung cuộn, legend + link.

Chi tiết cần đúng:

- **Lưới**: CSS grid, `grid-auto-flow: column`, `grid-template-rows: repeat(7, …)`, ô ~11px, khe 3px. Màu nền ô: `var(--gh-N)` theo `day.level`.
- **Căn cột**: chèn `leadingBlanks(days[0].date)` ô trống (`aria-hidden`, nền trong suốt) trước ngày đầu tiên. Với dữ liệu hiện tại giá trị này là 0, nhưng nó giữ lưới thẳng nếu GitHub đổi ngày bắt đầu.
- **Tooltip**: mỗi ô có `title={dict.day(day.count, formatted)}`, `formatted` lấy từ `Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" })` — khớp quy ước ngày của `src/lib/content/derive.ts`.
- **Nhãn tháng**: với mỗi cột, lấy tháng của ngày đầu cột; in nhãn khi khác tháng của cột trước. **en**: `Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" })` → `Nov`. **vi**: `` `T${thángSố}` `` → `T11` — dẫn xuất từ số, không hard-code danh sách tháng. Không dùng `Intl` cho `vi`: nó trả `thg 11`, dạng không có ở đâu trên site, còn `derive.ts` cũng cố ý tránh `Intl` cho `vi`.
- **Nhãn thứ**: chỉ hàng 2, 4, 6 (Mon/Wed/Fri), lấy qua `Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", { weekday: "short" })`.
- **Accessibility**: khung lưới là **một** phần tử `role="img"` với `aria-label={dict.graphLabel(total)}`; mọi ô `aria-hidden`. Không ô nào focus được — 368 tab stop là không chấp nhận được.
- **Mobile**: khung cuộn `overflow-x-auto`, đặt `direction: rtl` trên khung và `direction: ltr` trên lưới bên trong, để mặc định cuộn sẵn về tuần gần nhất mà không cần JS.
- **Link**: "Xem trên GitHub" → `year.profileUrl`, `target="_blank" rel="noreferrer"`.

- [ ] **Step 4: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: không lỗi (nếu thiếu key `github` trong `vi`, typecheck sẽ bắt được ở bước này)

---

### Task 5: Gắn section vào trang About

**Files:**
- Modify: `src/lib/content/schema.ts:45` (`SECTION_IDS`)
- Modify: `src/components/pages/shared.tsx:13-23` (`SECTION_PAGE`)
- Modify: `content/site.json` (mảng `sections`)
- Modify: `src/components/pages/about.tsx` (switch cuối file)
- Test: `tests/build-output.test.ts` (thêm)

**Interfaces:**
- Consumes: `GithubContributions` (Task 4)
- Produces: section id `"github"` khả dụng trong `site.json` và Command Palette

- [ ] **Step 1: Viết test thất bại trong `tests/build-output.test.ts`**

```ts
test("the GitHub heatmap renders on both About pages", { skip }, () => {
  const content = loadContent(process.cwd());
  const section = content.site.sections.find((s) => s.id === "github");
  if (!section?.visible || !fs.existsSync(path.join(process.cwd(), "src/data/github-contributions.json"))) return;
  const total = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src/data/github-contributions.json"), "utf8")).total;
  for (const page of ["about.html", "vi/about.html"]) {
    const html = fs.readFileSync(path.join(out, page), "utf8");
    assert.ok(html.includes(String(total)), `${page} thiếu tổng contributions`);
    assert.ok(html.indexOf('id="github"') < html.indexOf('id="expertise"'), `${page}: heatmap phải nằm trước Skillset`);
  }
  const en = fs.readFileSync(path.join(out, "about.html"), "utf8");
  const vi = fs.readFileSync(path.join(out, "vi/about.html"), "utf8");
  assert.ok(en.includes("contributions in the last 12 months"), "bản EN dùng chuỗi tiếng Anh");
  assert.ok(vi.includes("đóng góp trong 12 tháng qua"), "bản VI phải dịch, không rơi về EN");
});
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `pnpm build && pnpm test`
Expected: FAIL — `about.html thiếu tổng contributions`

- [ ] **Step 3: Thêm `"github"` vào `SECTION_IDS`**

Trong `src/lib/content/schema.ts:45`, thêm `"github"` vào mảng. Thứ tự trong mảng này không ảnh hưởng hiển thị — thứ tự hiển thị do `content/site.json` quyết định.

- [ ] **Step 4: Map section sang trang About**

Trong `src/components/pages/shared.tsx`, thêm `github: "/about"` vào `SECTION_PAGE`. TypeScript sẽ báo thiếu key nếu quên, vì kiểu là `Record<SectionId, …>`.

- [ ] **Step 5: Thêm mục vào `content/site.json › sections`, NGAY TRƯỚC `expertise`**

```json
{
  "id": "github",
  "label": { "en": "GitHub", "vi": "GitHub" },
  "title": { "en": "GitHub *Contributions*", "vi": "Hoạt động trên *GitHub*" },
  "visible": true
}
```

Vị trí trong mảng chính là thứ tự render — `sectionsOn()` giữ nguyên thứ tự mảng.

- [ ] **Step 6: Render trong `src/components/pages/about.tsx`**

Thêm `case "github": return <GithubContributions key={s.id} c={c} section={s} />;` vào switch, kèm import.

- [ ] **Step 7: Chạy build + toàn bộ test**

Run: `pnpm build && pnpm test && pnpm typecheck && pnpm lint`
Expected: tất cả PASS, kể cả test "no broken internal links" và "production output contains no Content Studio"

- [ ] **Step 8: Kiểm tra bằng mắt ở cả hai theme và hai ngôn ngữ**

Run: `pnpm preview`
Kiểm: `/about` và `/vi/about` — heatmap nằm trước "Professional Skillset"; 5 mức màu phân biệt được ở cả theme tối và sáng; thu hẹp cửa sổ xuống ~380px thì lưới cuộn ngang trong khung và **trang không cuộn ngang**; hover một ô có hoạt động hiện tooltip đúng ngôn ngữ.

---

### Task 6: CI và tài liệu

**Files:**
- Modify: `.github/workflows/deploy.yml`
- Modify: `DESIGN_SYSTEM.md`
- Modify: `CONTENT_MANAGEMENT.md`

**Interfaces:**
- Consumes: lệnh `pnpm sync:github` (Task 2)
- Produces: (không có)

- [ ] **Step 1: Thêm bước fetch vào workflow**

Trong `.github/workflows/deploy.yml`, chèn **trước** `- run: pnpm build`:

```yaml
      - name: Refresh GitHub contributions
        run: node tools/fetch-github-contributions.ts
```

Không cần `continue-on-error`: script luôn exit 0 theo thiết kế.

- [ ] **Step 2: Ghi tài liệu**

`DESIGN_SYSTEM.md`: thêm token `--gh-0..4` vào bảng màu; thêm GitHub heatmap vào mô tả bố cục trang About (trước Skillset); thêm một mục trong "Lịch sử thay đổi" đề ngày 2026-11-25.

`CONTENT_MANAGEMENT.md`: ghi rõ `src/data/github-contributions.json` là **dữ liệu sinh ra, không sửa tay**; làm mới bằng `pnpm sync:github`; CI tự làm mới mỗi lần deploy; tắt heatmap bằng cách đặt `visible: false` cho section `github` trong Content Studio. Ghi thêm hai giới hạn đã chấp nhận (spec §6b): bản preview local hiển thị snapshot đã commit nên có thể cũ hơn site thật; và nếu thiếu file dữ liệu thì section biến mất nhưng Command Palette vẫn còn mục "GitHub".

- [ ] **Step 3: Verify lần cuối**

Run: `pnpm build && pnpm test && pnpm typecheck && pnpm lint`
Expected: tất cả xanh

- [ ] **Step 4: Báo lại cho người dùng, KHÔNG commit**

Run: `git status --short`
Expected: liệt kê các file đã đổi/thêm. Để nguyên cho người dùng tự commit.
