# Thiết kế: Heatmap GitHub Contributions trên trang About

- **Ngày**: 2026-11-25
- **Trạng thái**: chờ duyệt
- **Dự án**: hieutt-portfolio (Next.js 16, static export, Cloudflare Pages)

---

## 1. Mục đích

Thêm vào trang `/about` một biểu đồ nhiệt (heatmap) hiển thị hoạt động GitHub 12 tháng
gần nhất của tài khoản `HieuTrung15`, giống khối contributions trên trang profile GitHub.

**Lý do**: portfolio hiện mô tả kinh nghiệm bằng chữ (Career Journey, Skillset, Education).
Heatmap bổ sung một bằng chứng định lượng, nhìn-là-hiểu về nhịp làm việc đều đặn — thứ mà
đoạn văn không truyền tải được. Nó đặt ngay trước "Professional Skillset" để người xem thấy
hoạt động thực tế trước khi đọc danh sách kỹ năng.

---

## 2. Goals / Non-goals / Anti-goals

### Goals

1. Hiển thị lưới 12 tháng gần nhất, mỗi ngày một ô, 5 mức đậm nhạt theo số contributions.
2. Hiển thị tổng số contributions trong 12 tháng (hiện tại: **629**).
3. Dữ liệu thật, tự làm mới sau mỗi lần deploy — không phải số gõ tay.
4. Trang vẫn là HTML tĩnh hoàn toàn: không gọi mạng từ trình duyệt người xem.
5. Hoạt động ở cả hai theme (tối mặc định / sáng) và cả hai ngôn ngữ (en/vi).
6. Bật/tắt và đổi tiêu đề được qua `content/site.json` như mọi section khác.

### Non-goals

- Thanh chọn năm (2026, 2025, 2024…) — chỉ 12 tháng gần nhất.
- Danh sách "Contribution activity" bên dưới lưới.
- Thống kê theo repo, streak, ngôn ngữ lập trình, hay bất kỳ số liệu GitHub nào khác.
- Dữ liệu realtime. Làm mới mỗi lần deploy là đủ.

### Anti-goals (làm sai thì coi như thất bại dù chạy được)

- **Build đỏ vì GitHub**: GitHub đổi markup hoặc mạng lỗi thì build phải vẫn xanh và deploy
  được, dùng dữ liệu lần trước. Không bao giờ để chuyện ngoài tầm kiểm soát chặn deploy.
- **Gửi dữ liệu người xem ra ngoài**: không gọi API bên thứ ba từ trình duyệt khách.
- **Thêm credential**: không token, không secret mới trong CI.
- **Cây git bẩn**: chạy `pnpm build` ở máy local không được tự sửa file đã commit.
- **Vỡ layout mobile**: lưới 53 cột không được làm trang cuộn ngang.

---

## 3. Ràng buộc

| Ràng buộc | Hệ quả |
|---|---|
| `output: "export"` — static export, không có server runtime | Dữ liệu phải có sẵn lúc build |
| Deploy qua GitHub Actions → Cloudflare Pages | CI có mạng, có thể fetch lúc build |
| Contribution calendar không có trong REST API công khai | Phải đọc HTML trang profile công khai |
| Người dùng đã bật "Private contributions" public | Endpoint công khai trả đúng 629 (đã xác minh) |
| Mọi dữ liệu hiển thị đi qua `content/` + Zod + Content Studio | Cấu hình phải nằm trong `content/`, nhưng dữ liệu *sinh ra* thì không |
| Không muốn thêm dependency npm | Parse HTML bằng regex, không dùng thư viện DOM |

---

## 4. Các hướng đã cân nhắc

| Hướng | Cách làm | Đánh đổi |
|---|---|---|
| **A — Fetch lúc build (đã chọn)** | Script trong `tools/` đọc HTML profile công khai, ghi JSON; trang đọc JSON lúc build | Dữ liệu mới lại sau mỗi deploy, không realtime. Parser phụ thuộc markup GitHub → cần fallback |
| B — Fetch từ trình duyệt qua API bên thứ ba | Component client gọi `github-contributions-api.jogruber.de` | Phụ thuộc dịch vụ miễn phí có thể chết; heatmap trống đến khi JS chạy; SEO không thấy; **gửi IP mỗi khách sang bên thứ ba** |
| C — Snapshot commit tay | Cùng script, chạy thủ công khi muốn | Tất định tuyệt đối, build offline được, nhưng số liệu đứng yên đến khi nhớ chạy lại |

**Đã chọn: A.** Lý do: hợp kiến trúc sẵn có (site vốn static, mọi dữ liệu có sẵn lúc build),
cho dữ liệu tự mới mà không thêm phụ thuộc runtime hay credential nào. Với fallback về file cũ,
rủi ro xấu nhất chỉ là "số liệu cũ vài ngày", không phải "trang vỡ" hay "deploy đỏ".

B bị loại vì đánh đổi quyền riêng tư của khách truy cập lấy độ tươi vài giờ, trong khi dữ liệu
này mỗi ngày mới đổi một lần.

A và C dùng **chung một script**, chỉ khác chỗ script chạy ở đâu. Thiết kế dưới đây hỗ trợ cả hai
cùng lúc: CI chạy tự động (A), và có lệnh `pnpm sync:github` để chạy tay khi muốn (C).

---

## 5. Thiết kế

### 5.1 Nguồn dữ liệu

Endpoint công khai, không cần token, không cần đăng nhập:

```
GET https://github.com/users/<username>/contributions
```

Đã xác minh ngày 2026-11-25 (HTTP 200):

- `629 contributions in the last year` trong `<h2 id="js-contribution-activity-description">`
- **368 ô ngày**, mỗi ô là `<td class="ContributionCalendar-day" data-date="YYYY-MM-DD"
  data-level="0..4" id="contribution-day-component-R-C">`
- Khoảng ngày: `2025-11-23` → `2026-11-25`
- Số chính xác từng ngày nằm trong `<tool-tip for="<id ô>">`, dạng
  `"4 contributions on November 24th."` hoặc `"No contributions on November 23rd."`
- 125 ngày có hoạt động

### 5.2 Script: `tools/fetch-github-contributions.ts`

Plain Node, không import Next/React — cùng quy ước với `src/lib/content/load.ts`.

1. Đọc username từ `content/social-links.json` (mục `icon: "github"`, lấy phần cuối URL).
   **Không thêm trường config mới** — URL GitHub đã có sẵn ở đó, giữ một nguồn sự thật duy nhất.
   Giá trị rút ra phải khớp charset login của GitHub (`^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$`)
   trước khi ghép vào URL. Trường `url` này được phép rỗng (đó là cách ẩn link trong Studio),
   nên thiếu hoặc sai định dạng là tình huống bình thường, không phải lỗi lập trình.
2. Fetch endpoint trên, timeout 15s.
3. Parse: duyệt các `<td class="ContributionCalendar-day">` lấy `data-date` + `data-level` + `id`;
   dựng map `id → số` từ các `<tool-tip>`.
4. **`total` = tổng `count` của các ngày đã parse**, không lấy trực tiếp từ `<h2>`.
   Số ở `<h2 id="js-contribution-activity-description">` chỉ dùng để **đối chiếu**: lệch thì
   `console.warn`, không chặn gì. Lý do: tổng hiển thị phải luôn khớp với lưới được vẽ, và tính năng
   không được phụ thuộc sống còn vào một `id` phần tử mà GitHub có thể đổi tên bất cứ lúc nào.
   Đã xác minh 2026-11-25: hai con số bằng nhau (629 = 629).
5. Ghi `src/data/github-contributions.json`.

**Xử lý lỗi — đây là phần quan trọng nhất của script:**

| Tình huống | Hành vi |
|---|---|
| Không có URL GitHub trong `social-links.json`, hoặc không rút được username hợp lệ | Cảnh báo, **giữ nguyên file cũ**, `exit 0` |
| Mạng lỗi / timeout / HTTP ≠ 200 | In cảnh báo rõ ràng, **giữ nguyên file cũ**, `exit 0` |
| Parse ra 0 ngày, hoặc < 300 ngày | Coi như markup đã đổi: cảnh báo, giữ file cũ, `exit 0` |
| Thiếu `<h2>` tổng | **Không** coi là lỗi — tổng vẫn tính từ các ngày. Chỉ cảnh báo |
| Chưa có file cũ và fetch thất bại | Không ghi gì; trang sẽ ẩn section (xem 5.5) |

Script **không bao giờ exit khác 0**. Build không được đỏ vì lý do nằm ngoài tầm kiểm soát.

### 5.3 Nơi lưu dữ liệu: `src/data/github-contributions.json`

**Không đặt trong `content/`.** `content/` là dữ liệu *do người viết*, được Content Studio sửa,
validate bằng Zod và round-trip qua `serializeContent()`. Dữ liệu này là *sinh ra từ máy* —
để nó vào `content/` sẽ hiện một form rỗng vô nghĩa trong Studio và làm hỏng giả định round-trip.

File này **được commit** (là fallback và để build offline chạy được).

```json
{
  "username": "HieuTrung15",
  "profileUrl": "https://github.com/HieuTrung15",
  "total": 629,
  "from": "2025-11-23",
  "to": "2026-11-25",
  "fetchedAt": "2026-11-25T03:12:00.000Z",
  "days": [{ "date": "2025-11-23", "count": 0, "level": 0 }]
}
```

Đọc bằng `fs.readFileSync` trong một hàm bọc `cache()` (giống `src/lib/content/index.ts`),
**không dùng `import` JSON** — để file thiếu thì trả `null` chứ không làm hỏng biên dịch.

### 5.4 Cấu hình qua `content/site.json`

Thêm section id mới `"github"`:

- `src/lib/content/schema.ts` → thêm `"github"` vào `SECTION_IDS`
- `src/components/pages/shared.tsx` → `SECTION_PAGE.github = "/about"`
- `content/site.json › sections` → thêm mục `github` **ngay trước `expertise`** (thứ tự trong
  mảng chính là thứ tự hiển thị, do `sectionsOn()` giữ nguyên thứ tự)
- `src/components/pages/about.tsx` → thêm `case "github":` vào switch

Nội dung mục mới:

```json
{
  "id": "github",
  "label": { "en": "GitHub", "vi": "GitHub" },
  "title": { "en": "GitHub *Contributions*", "vi": "Hoạt động trên *GitHub*" },
  "visible": true
}
```

Lợi ích: bật/tắt và đổi tiêu đề được từ Content Studio, và section tự xuất hiện trong
Command Palette (`Ctrl/⌘ K`) như mọi section khác.

### 5.5 Component: `src/components/sections/github-contributions.tsx`

**Server component, không có JS phía client.**

Nếu không có dữ liệu (file thiếu, hoặc `days` rỗng) → trả `null`, section biến mất hoàn toàn.
Không hiện khung rỗng, không hiện thông báo lỗi cho người xem.

```
┌──────────────────────────────────────────────────────────────────┐
│                   Hoạt động trên GitHub                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  629 đóng góp trong 12 tháng qua · 125 ngày hoạt động      │  │
│  │                                                            │  │
│  │       T11  T12   T1   T2   T3   T4  …  T10  T11            │  │
│  │  T2   ▢▢▣▢ ▢▣▢▢ ▢▢▢▣ ▣▢▢▢ ▢▣▣▢ ▢▢▣▢ …                      │  │
│  │  T4   ▢▣▢▢ ▢▢▣▢ ▣▢▢▢ ▢▢▣▢ ▣▢▢▣ ▢▣▢▢ …                      │  │
│  │  T6   ▢▢▢▣ ▣▢▢▢ ▢▣▢▢ ▢▢▢▣ ▢▣▢▢ ▣▢▢▢ …                      │  │
│  │                                                            │  │
│  │  Ít ▢ ▢ ▣ ▣ ▮ Nhiều              Xem trên GitHub ↗         │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

- Khung ngoài dùng `glow-card` — cùng ngôn ngữ thị giác với Highlights, Education, Career Journey.
- Tiêu đề section qua `SectionHeading` (cú pháp `*từ nhấn*` lấy từ `site.json`).
- Câu tổng là **chữ thật**, không phải ảnh: đó là thứ người dùng screen reader và Google đọc được.
- Lưới: CSS grid, `grid-auto-flow: column`, 7 hàng, ô ~11px, khe 3px (≈ 740px ở desktop).
- Nhãn thứ: chỉ T2 / T4 / T6 (Mon / Wed / Fri) như GitHub.
- Nhãn tháng: gắn vào cột đầu tiên của mỗi tháng mới.
  - **en**: `Intl.DateTimeFormat("en-US", { month: "short" })` → `Nov`, `Dec`…
  - **vi**: `"T" + số tháng` → `T11`, `T12`… Dẫn xuất từ số, **không** hard-code danh sách tháng.
    Không dùng `Intl` cho `vi` vì nó trả `thg 11`, dạng không xuất hiện ở đâu trên site này.
    `src/lib/content/derive.ts` cũng cố ý tránh `Intl` cho `vi` và dùng dạng số (`08/2025`); `T11`
    là bản rút gọn cùng quy ước đó, hợp với chỗ hẹp phía trên lưới.
- Mỗi ô có `title` (tooltip gốc trình duyệt), vd `"4 đóng góp ngày 24/11/2026"`. Không cần JS.
- Link "Xem trên GitHub" trỏ tới `profileUrl`, `target="_blank" rel="noreferrer"`.

**Mobile**: bọc lưới trong `overflow-x-auto`, cuộn ngang trong khung — trang không bao giờ
cuộn ngang. Mặc định cuộn sẵn về phía **bên phải** (tuần gần nhất) bằng thủ thuật
`direction: rtl` trên khung cuộn + `direction: ltr` trên nội dung, để không phải thêm JS.

**Kích thước HTML**: 368 ô + 368 thuộc tính `title` ≈ 25–30KB HTML thô, nhưng là markup lặp
lại nên gzip còn khoảng 2–4KB. Chấp nhận được, không cần tối ưu.

### 5.6 Màu

Thêm 5 token vào `src/app/globals.css`, định nghĩa ở cả `:root` (sáng) và `.dark` (tối),
đúng cách design system hiện tại làm:

```
--gh-0  ô không có đóng góp
--gh-1 … --gh-4  bốn mức tăng dần
```

Dẫn xuất từ `--brand` (`#13D95C`) bằng `color-mix()` với `--card`, để heatmap thuộc về bảng màu
của site chứ không phải màu xanh GitHub dán vào. Điểm xuất phát gợi ý:

- **Tối**: `--gh-0` = trắng 6%; mức 1→4 = `--brand` trộn 25% / 45% / 70% / 100% với `--card`.
- **Sáng**: `--gh-0` = đen 5%; mức 1→4 = `--brand` trộn 30% / 55% / 80% / 100% với trắng, và
  mức 4 dùng tông đậm hơn (`#08843F`) để không bị chói trên nền trắng.

Yêu cầu bắt buộc: 5 mức phải phân biệt được bằng mắt ở **cả hai theme**, và `--gh-0` phải
phân biệt được với nền card. Giá trị chính xác để người implement tinh chỉnh.

### 5.7 i18n

Thêm khối `github` vào từ điển `t(locale)` trong `src/lib/i18n.ts` (cả `en` và `vi`):

| Key | en | vi |
|---|---|---|
| `summary(total, days)` | `629 contributions in the last 12 months · 125 active days` | `629 đóng góp trong 12 tháng qua · 125 ngày hoạt động` |
| `less` / `more` | `Less` / `More` | `Ít` / `Nhiều` |
| `day(count, date)` | `4 contributions on Nov 24, 2026` / `No contributions on Nov 23, 2025` | `4 đóng góp ngày 24/11/2026` / `Không có đóng góp ngày 23/11/2025` |
| `viewProfile` | `View on GitHub` | `Xem trên GitHub` |
| `graphLabel(total)` | `Contribution graph: 629 contributions over the last 12 months` | `Biểu đồ đóng góp: 629 lượt trong 12 tháng qua` |

Định dạng ngày theo `Intl.DateTimeFormat(locale)` — khớp quy ước sẵn có
(EN `Aug 2025 – Present`, VI `08/2025 – Hiện tại`).

### 5.8 Accessibility

- Section có `aria-labelledby` trỏ tới tiêu đề, giống các section khác.
- Câu tổng là văn bản thật → screen reader đọc được con số mà không cần chạm vào lưới.
- Lưới là **một** `role="img"` với `aria-label` = `graphLabel(total)`; từng ô `aria-hidden`.
  Lý do: 368 phần tử focus được sẽ biến phím Tab thành cực hình. Thông tin đầy đủ đã có ở
  câu tổng; lưới là phần minh họa bổ sung.
- Màu sắc là kênh truyền tin duy nhất bên trong lưới → chấp nhận được vì lưới không phải nguồn
  thông tin duy nhất (câu tổng + `title` từng ô bù lại).
- Link "Xem trên GitHub" có nhãn rõ nghĩa, không phải "tại đây".
- Không có animation → không cần xử lý `prefers-reduced-motion`.

### 5.9 Tích hợp build và CI

**`package.json`** — thêm script, **không đụng vào `build`**:

```json
"sync:github": "node tools/fetch-github-contributions.ts"
```

Để `build` không fetch mạng, vì ba lý do: build local tất định, build offline được, và
`pnpm build` không tự sửa file đã commit (cây git luôn sạch).

Nhưng `deploy:cloudflare` (deploy tay từ máy local, có ghi trong README) **có** chạy sync trước:

```json
"deploy:cloudflare": "npm run sync:github && npm run build && npx --yes wrangler@4 pages deploy --branch main"
```

Một lần deploy phải đẩy dữ liệu tươi. Ràng buộc "cây git sạch" nhắm vào `build` — lệnh chạy liên
tục khi đang code — chứ không nhắm vào một hành động deploy có chủ đích, hiếm khi chạy, và khi đó
snapshot được làm mới còn là thứ đáng commit.

**`.github/workflows/deploy.yml`** — thêm một bước trước `pnpm build`:

```yaml
- run: node tools/fetch-github-contributions.ts
```

CI lấy dữ liệu tươi mỗi lần deploy; file trong repo chỉ là snapshot dự phòng, có thể cũ hơn —
điều đó không sao.

**Ngoài phạm vi, ghi lại để sau**: thêm `schedule: cron` vào workflow để site tự làm mới hằng
ngày dù không có commit mới. Ba dòng YAML, làm sau khi thấy cần.

### 5.10 Tests

`tests/github-contributions.test.ts` (mới):

1. Parse fixture `tests/fixtures/github-contributions.html` (một đoạn HTML thật đã cắt gọn)
   → đúng số ngày, đúng tổng, đúng `count`/`level` của một ngày đã biết.
2. HTML rác / rỗng → parser trả `null`, **không ném lỗi**.
3. Thiếu file dữ liệu → hàm đọc trả `null`.

`tests/build-output.test.ts` (sửa): nếu `src/data/github-contributions.json` tồn tại và section
`github` đang bật, thì `out/about.html` và `out/vi/about.html` phải chứa con số tổng.

---

## 6. Để lại cho người implement

- Giá trị hex/`color-mix` chính xác của `--gh-0..4` ở hai theme (ràng buộc ở 5.6).
- Cách parse HTML cụ thể (regex hay máy trạng thái nhỏ) — miễn không thêm dependency.
- Thuật toán gắn nhãn tháng vào cột.
- Kích thước ô / khe chính xác, và breakpoint bắt đầu cuộn ngang.
- Có hiện `fetchedAt` ra giao diện hay không. **Mặc định: không.** Lý do: GitHub cũng không
  hiện, và một dòng "cập nhật 3 ngày trước" chỉ mời người xem đặt câu hỏi về độ tươi của dữ
  liệu vốn không quan trọng. Dễ đổi ý sau.

## 6b. Quyết định sau rà soát thiết kế (2026-11-25)

Một reviewer độc lập đọc bản thảo và nêu 7 điểm. Các quyết định chốt lại:

| Điểm | Quyết định | Lý do |
|---|---|---|
| Snapshot cũ nhưng tiêu đề nói "12 tháng qua" | **Hiển thị đúng những gì có trong file.** Không re-base, không ẩn theo tuổi dữ liệu | CI fetch mỗi lần deploy nên site thật luôn tươi; chỉ bản preview local mới cũ. Re-base sẽ phải chèn ngày level-0 không có thật — tức là bịa số liệu |
| Tổng lấy từ `<h2>` hay từ lưới? | **Từ lưới** (xem 5.2). `<h2>` chỉ để đối chiếu | Tổng hiển thị luôn khớp lưới; GitHub đổi `id` cũng không đóng băng tính năng |
| Tên tháng tiếng Việt | **`T11`** (xem 5.5) | `thg 11` của `Intl` không dùng ở đâu trên site; `T11` hợp quy ước số sẵn có |
| Username thiếu / sai định dạng | Cảnh báo, giữ file cũ, `exit 0` (xem 5.2) | `url` rỗng là cách hợp lệ để ẩn link; không được làm deploy đỏ |
| Snapshot đầu tiên lấy ở đâu | Chạy `pnpm sync:github` một lần rồi commit | Đã chạy thử trong quá trình thiết kế: endpoint trả 200, parse đúng 368 ngày |
| `deploy:cloudflare` deploy dữ liệu cũ | Thêm sync vào lệnh đó (xem 5.9) | Deploy tay cũng phải đẩy dữ liệu tươi |
| Command Palette còn mục "GitHub" khi section ẩn | **Chấp nhận** | File dữ liệu được commit nên section gần như luôn có mặt. Để `sectionsOn()` biết được tình trạng dữ liệu thì phải đẩy thao tác đọc file lên một tầng, chạm vào cả hai trang và palette — không đáng cho một trường hợp chỉ xảy ra khi checkout hỏng |

## 7. Rủi ro đã biết

| Rủi ro | Giảm thiểu |
|---|---|
| GitHub đổi markup → parser gãy | Fallback giữ file cũ, build vẫn xanh. Script in cảnh báo rõ trong log CI. Test fixture **không** bắt được thay đổi phía GitHub — chỉ log CI mới phát hiện |
| Người dùng tắt lại "Private contributions" | Số tự tụt về ~210. Không phải lỗi, là lựa chọn của chủ tài khoản |
| Tài khoản GitHub đổi tên | Script đọc username từ `social-links.json` → sửa một chỗ là xong |
| Rate limit trang profile công khai | Mỗi deploy một request. Không đáng lo |
