# HieuTT Portfolio

Portfolio cá nhân của **Trần Trung Hiếu** — ERPNext Developer & Enterprise Software Engineer.

Website tĩnh (static export), giao diện tông xanh lá → xanh dương với font Lexend + Quicksand (theo vietapp.vn), bản tối nền navy có sao (bố cục theo soumyajit.vercel.app; xem DESIGN_SYSTEM.md), **song ngữ English (US, mặc định) / Tiếng Việt**, kèm **HieuTT Content Studio** để cập nhật nội dung bằng form trên máy local mà không sửa code giao diện.

- Hướng dẫn cập nhật nội dung: [CONTENT_MANAGEMENT.md](CONTENT_MANAGEMENT.md)
- Hệ thống thiết kế: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)
- Nội dung còn thiếu cần bổ sung trước khi publish: [CONTENT_TODO.md](CONTENT_TODO.md)

## Tech stack

| Thành phần | Phiên bản |
|---|---|
| Node.js | ≥ 22.18 (đã kiểm thử 22.23) — cần cho TypeScript chạy trực tiếp trong Node |
| Next.js (App Router, static export, Turbopack) | 16.4.6 |
| React / React DOM | 19.3.1 |
| TypeScript (strict) | 6.0.3 |
| Tailwind CSS + @tailwindcss/typography | 4.3.5 |
| shadcn/ui pattern (Radix Dialog, Accordion, Slot) + cmdk | Radix 1.3.x, cmdk 1.1.1 |
| Magic UI (BlurFade) + Motion | motion 14.14.0 |
| Zod (schema + validation) | 4.6.7 |
| react-markdown + remark-gfm | 10.1.0 / 4.0.1 |
| lucide-react, next-themes | 1.77.0 / 0.4.6 |
| simple-icons (logo công nghệ trên thẻ kỹ năng, CC0) | 16.38.0 |
| ESLint (eslint-config-next) | 9.39.5 |
| Package manager | pnpm 10.34.9 (`npm` cũng chạy được) |

Không có database, không có backend production. Kiểm thử dùng test runner có sẵn của Node (`node --test`), không thêm thư viện test.

## Lệnh

```bash
corepack enable          # một lần, để có lệnh pnpm (hoặc dùng npm run …)
pnpm install             # cài dependencies

pnpm dev                 # website dev: http://localhost:3000
pnpm studio              # Content Studio http://127.0.0.1:4321 + website dev http://127.0.0.1:3000
pnpm studio -- --no-site # chỉ chạy Studio (khi đã chạy pnpm dev ở terminal khác)

pnpm typecheck           # TypeScript
pnpm lint                # ESLint
pnpm test                # unit + integration test (content, Studio, output build)
pnpm build               # build production → thư mục out/
pnpm preview             # xem bản build production: http://127.0.0.1:4173
```

Nên chạy `pnpm build` trước `pnpm test` để các test kiểm tra thư mục `out/` (link hỏng, draft, không lộ Studio) được thực thi; nếu chưa build, các test đó được đánh dấu *skipped*.

### Lưu ý trên Windows

- Chạy lệnh từ **PowerShell / cmd**, hoặc trong Git Bash hãy `cd /D/...` (ổ đĩa viết hoa). Git Bash báo đường dẫn dạng `d:\...` trong khi symlink của pnpm trỏ tới `D:\...`, khiến bundler nạp React hai lần và build lỗi `Cannot read properties of null (reading 'useContext')`. `pnpm studio` tự xử lý việc này cho dev server mà nó khởi động.
- `pnpm build` chạy thêm `tools/fix-windows-export.ts`: Next.js 16 trên Windows ghi các file prefetch với dấu `\` (thành thư mục lồng nhau), làm request prefetch bị 404. Script này làm phẳng lại các file đó; trên Linux/macOS nó không làm gì.

## Tính năng

**Song ngữ**

- English (US) là mặc định, phục vụ ở `/…`; Tiếng Việt ở `/vi/…`. Cả hai đều là trang tĩnh, có `<html lang>` đúng, Open Graph locale, `hreflang` + canonical (khi có domain) và sitemap cho cả hai ngôn ngữ.
- Nút **EN | VI** trên navbar (và trong menu mobile) chuyển sang cùng trang ở ngôn ngữ kia (giữ nguyên `#section`); Command Palette có lệnh "View in English / Xem bằng Tiếng Việt".
- **Ghi nhớ lựa chọn**: ngôn ngữ người xem chọn bằng nút trên được lưu trong `localStorage` (`preferred-locale`). Lần sau mở một URL tiếng Anh (`/…`), họ được chuyển sang cùng trang tiếng Việt trước khi trang hiển thị. Link đã chỉ rõ ngôn ngữ (`/vi/…`) luôn mở đúng như được chia sẻ; người xem mới, bot tìm kiếm và khung xem trước của Studio không bị chuyển hướng. Logic nằm trong `localeBootScript()` (`src/lib/i18n.ts`), chạy trong `<head>` của root layout.
- Nội dung dịch được lưu dạng `{ "en": "…", "vi": "…" }` ngay trong file nội dung; thiếu một ngôn ngữ thì website hiển thị ngôn ngữ còn lại và Studio cảnh báo. Chữ giao diện (nút, nhãn) nằm trong `src/lib/i18n.ts`.

**Website công khai**

- `/` (và `/vi`) — Hero (lời chào, tên, vai trò gõ chữ, minh họa SVG), Let me introduce myself, Professional Highlights (số năm kinh nghiệm và số công ty **tự tính** từ dữ liệu), Find Me On.
- `/about` — Beyond the Code (giới thiệu đầy đủ, sở thích, trích dẫn), Professional Skillset (chọn kỹ năng → dự án liên quan), Career Journey (timeline), Education.
- `/resume` và `/vi/resume` — CV dạng tờ giấy trắng dựng từ dữ liệu, có nút **Download** / **Tải về** để tải PDF trực tiếp.
- Tiêu đề, thứ tự, ẩn/hiện các section và nhãn menu đều cấu hình trong `content/site.json`.
- `/projects` — **My Recent Works**: bộ lọc danh mục sinh từ dữ liệu (chỉ hiện danh mục có dự án), tìm kiếm theo tên, tổ chức, công nghệ, lĩnh vực (không phân biệt dấu tiếng Việt), empty state.
- `/projects/[slug]` — Case study: breadcrumb, meta, hình minh họa sinh từ dữ liệu, Bối cảnh (Markdown), Trách nhiệm phân loại (trực tiếp phát triển / cùng nhóm / quản lý triển khai / vận hành), Phân hệ, Công nghệ & kỹ năng, **Interactive System Explorer**, Kết quả & đóng góp, gallery, dự án liên quan, trước/sau, mục lục. Dự án thiếu dữ liệu hiển thị thông báo "đang bổ sung" thay vì nội dung bịa.
- 404 riêng; sitemap, robots, Open Graph image (site + từng dự án, có font tiếng Việt), Twitter card, canonical (khi có domain), JSON-LD `Person` (chỉ thông tin công khai).
- **Developer Command Palette** — `Ctrl + K` / `⌘ + K`: tìm dự án, kỹ năng, đi tới section/trang, sao chép/gửi email, đổi theme. Dữ liệu lấy từ content layer.
- Navbar cố định (mờ khi cuộn, hamburger trên mobile), nền sao chuyển động, footer 3 cột; theme **tối mặc định**, có bản sáng, lựa chọn được lưu lại; hỗ trợ `prefers-reduced-motion`.

**Quản lý nội dung**

- Toàn bộ nội dung nằm trong `content/` (JSON + Markdown), có Zod schema và kiểm tra tham chiếu chéo (skill ↔ project, experience ↔ project, node ↔ edge…). Nội dung sai ⇒ build dừng với danh sách lỗi dễ đọc.
- Dự án có trạng thái `draft` / `published`: draft xem được ở bản dev, không bao giờ vào bản production.
- **HieuTT Content Studio** (`pnpm studio`): form sinh tự động từ schema, thêm/sửa/xóa (có xác nhận)/sắp xếp, upload ảnh & CV, xem trước Markdown, xem trước website dev, kiểm tra hợp lệ, lưu vào file, sao lưu tự động, xuất backup.

## Kiến trúc thư mục

```text
content/                 Nội dung (nguồn dữ liệu duy nhất)
  site.json              SEO, logo, màu nhấn, menu, section, danh mục dự án, CV
  profile.json           Hồ sơ, Hero, About, Contact
  highlights.json        Chỉ số (hỗ trợ {years}, {companies})
  experience.json        Công ty, thời gian, công việc, dự án liên quan
  skills.json            Nhóm kỹ năng + kỹ năng
  education.json, social-links.json
  projects/<slug>.json   Mỗi dự án một file (kể cả sơ đồ hệ thống)
  case-studies/<slug>.en.md, <slug>.vi.md  Bối cảnh nghiệp vụ (Markdown, mỗi ngôn ngữ một file)
public/uploads, public/cv  Ảnh và CV tải lên qua Studio
src/
  app/                   Routes: (en)/… = English tại /, vi/… = Tiếng Việt tại /vi; 404, OG, sitemap, robots
    components/pages/    Nội dung từng trang (dùng chung cho hai ngôn ngữ)
  components/
    layout/              Navbar, footer (site-shell), nền sao, avatar, theme toggle, EN|VI, copy/search button
    pages/               Nội dung từng trang (home, about, projects, project, resume…)
    sections/            Các section trang chủ + skill explorer + timeline
    projects/            Project card, explorer (filter/search), illustration
    diagrams/            InteractiveSystemExplorer, FeaturedSystems
    command-palette/     Command Palette (cmdk)
    ui/                  shadcn-style primitives (button, badge, dialog, command, accordion)
    magicui/             BlurFade (Magic UI, MIT)
  lib/
    content/schema.ts    Zod schemas + TypeScript types
    content/load.ts      Đọc / validate / serialize content (dùng chung cho site, Studio, test)
    content/derive.ts    Dữ liệu suy ra (thời gian, số năm, dự án liên quan…)
    content/localize.ts  Chọn ngôn ngữ cho nội dung { en, vi } (có fallback)
    content/index.ts     Truy cập content từ Next.js theo ngôn ngữ (ẩn draft ở production)
    i18n.ts              Chữ giao diện EN/VI, đường dẫn theo ngôn ngữ
    markdown.ts, og.tsx, search.ts, utils.ts
tools/
  content-studio/        Studio: server.ts (Node, 127.0.0.1) + app.js/index.html/studio.css
  preview.ts             Server tĩnh xem thử thư mục out/
  fix-windows-export.ts  Sửa lỗi đường dẫn export trên Windows
tests/                   content, studio, build-output tests
```

Studio nằm ngoài `src/` và website là static export, nên bản production **không chứa** Studio hay endpoint chỉnh sửa nào (`tests/build-output.test.ts` kiểm tra điều này).

## Triển khai

Kết quả build là thư mục tĩnh `out/`, đưa lên bất kỳ static host nào. Trước khi publish, xem [CONTENT_TODO.md](CONTENT_TODO.md).

**Domain**: `content/site.json › url` = `https://henry-tran.is-a.dev` (có thể ghi đè bằng biến môi trường `SITE_URL` khi build). Domain này dùng cho canonical, hreflang, sitemap, robots và ảnh Open Graph.

### Cloudflare Pages + henry-tran.is-a.dev (đang dùng)

`pnpm build` tạo thêm `out/_headers` (`tools/cloudflare-headers.ts`): ảnh Open Graph không có đuôi file nên được gán `Content-Type: image/png`, file trong `/_next/static/` được cache 1 năm, mọi trang có header bảo mật. `wrangler.toml` khai báo project `henry-tran` và thư mục `out/`.

**1. Đưa site lên Cloudflare Pages** (một lần đăng nhập, sau đó chỉ cần bước deploy):

```bash
npx wrangler@4 login                                                      # mở trình duyệt, bấm Allow
npx wrangler@4 pages project create henry-tran --production-branch main   # chỉ lần đầu
pnpm run deploy:cloudflare                                                # build + upload out/
```

Site chạy tại `https://henry-tran.pages.dev` (nếu tên bị trùng, Cloudflare sẽ báo tên khác — dùng đúng tên đó ở bước 2).
Lưu ý: dùng `pnpm run deploy:cloudflare`, không phải `pnpm deploy` (lệnh có sẵn của pnpm).

**2. Đăng ký henry-tran.is-a.dev** ([docs.is-a.dev](https://docs.is-a.dev/guides/cloudflare-pages/)):

1. Fork <https://github.com/is-a-dev/register>, tạo file `domains/henry-tran.json`:
   ```json
   {
     "owner": {
       "username": "HieuTrung15",
       "email": "hieutrungvietnam0107@gmail.com"
     },
     "records": {
       "CNAME": "henry-tran.pages.dev"
     }
   }
   ```
2. Mở Pull Request **giữ nguyên PR template** (không xoá comment): tick đủ 7 ô `[x]`, dán `https://henry-tran.pages.dev` giữa `WEBSITE_PREVIEW_START/END` (template yêu cầu link, không phải ảnh), ghi mục đích "portfolio" giữa `WEBSITE_PURPOSE_START/END`.
3. Chờ maintainer duyệt và merge. DNS có hiệu lực vài phút sau khi merge.

**3. Gắn domain vào Pages** (đã làm ngày 2026-11-20, trạng thái chờ DNS; Cloudflare tự xác minh và cấp SSL khi bản ghi CNAME của bước 2 xuất hiện). Nếu cần làm lại: is-a.dev nằm trong Public Suffix List nên không thêm được từ dashboard. Dùng <https://cf-pages.is-a.dev>, hoặc Cloudflare API:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/pages/projects/henry-tran/domains" \
  -H "Authorization: Bearer <API_TOKEN có quyền Pages:Edit>" -H "Content-Type: application/json" \
  --data '{"name":"henry-tran.is-a.dev"}'
```

**4. CI/CD (GitHub Actions)** (hướng dẫn từng bước từ đầu: [docs/DEPLOY.md](docs/DEPLOY.md)): mỗi lần push lên `main`, [.github/workflows/deploy.yml](.github/workflows/deploy.yml) chạy `pnpm build`, `typecheck`, `lint`, `test` rồi `wrangler pages deploy`. Bước nào lỗi thì dừng, website giữ nguyên bản cũ. Repo cần 2 secret (Settings › Secrets and variables › Actions):

| Secret | Giá trị |
| --- | --- |
| `CLOUDFLARE_API_TOKEN_PORTFOLIO` | Cloudflare › My Profile › API Tokens › Create Token › Custom token, quyền **Account › Cloudflare Pages › Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | ID tài khoản (Workers & Pages › Overview, cột bên phải) |

Cập nhật nội dung sau này: sửa bằng Studio → commit → `git push`. Vẫn có thể deploy tay từ máy bằng `pnpm run deploy:cloudflare`.

### Vercel

1. Đẩy repository lên GitHub/GitLab, import vào Vercel.
2. Framework: Next.js. Install command: `pnpm install`. Build command: `pnpm build`. Output: Vercel tự nhận `out/` từ `output: "export"`.
3. (Tuỳ chọn) Thêm biến môi trường `SITE_URL=https://your-domain`.

### Máy chủ riêng (nginx)

```bash
pnpm build
rsync -av --delete out/ user@server:/var/www/hieutt/
```

```nginx
server {
  server_name your-domain;
  root /var/www/hieutt;
  location / { try_files $uri $uri.html $uri/index.html =404; }
  error_page 404 /404.html;
  gzip on; gzip_types text/css application/javascript application/json image/svg+xml text/plain;
  location /_next/static/ { expires 1y; add_header Cache-Control "public, immutable"; }
  add_header X-Content-Type-Options nosniff;
  add_header Referrer-Policy strict-origin-when-cross-origin;
}
```

Lưu ý: file Open Graph image không có đuôi (vd `/opengraph-image`, `/vi/opengraph-image`, `/projects/<slug>/opengraph-image-<hash>`); nếu host trả sai content-type, thêm rule `location ~ /opengraph-image[^/.]*$ { default_type image/png; }`. Trang 404 tĩnh hiển thị cả hai ngôn ngữ vì host chỉ phục vụ một file `404.html`.

## Kết quả kiểm thử gần nhất

Xem phần báo cáo bàn giao. Lighthouse là mục tiêu, không phải cam kết; đo lại sau khi deploy bằng Lighthouse/PageSpeed Insights.

## Giấy phép & ghi công

Nền tảng kỹ thuật dựa trên [magicuidesign/portfolio](https://github.com/magicuidesign/portfolio) (MIT, © Dillion Verma) — thông báo giấy phép gốc được giữ trong [LICENSE](LICENSE). Giao diện, nội dung và các thành phần còn lại được xây dựng mới cho dự án này. Once UI Magic Portfolio và Dashfolio chỉ được tham khảo về nguyên tắc trình bày; không sao chép mã nguồn hay tài nguyên.
