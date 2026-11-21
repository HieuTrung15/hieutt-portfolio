# Design System — HieuTT Portfolio

**Green → blue portfolio**: tông màu chủ đạo xanh lá → xanh dương và cặp font Lexend + Quicksand theo phong cách [vietapp.vn](https://vietapp.vn/). Bản tối có nền xanh navy và sao chuyển động; card phát sáng. Bố cục và hiệu ứng lấy cảm hứng từ [soumyajit.vercel.app](https://soumyajit.vercel.app/), được viết lại hoàn toàn; không dùng mã nguồn, ảnh, logo hay icon của hai trang đó. Có bản sáng (trắng, gần với Vietapp) qua nút đổi theme; **mặc định là tối**.

## Màu (design tokens)

Định nghĩa trong `src/app/globals.css` (`:root` = sáng, `.dark` = tối), dùng qua Tailwind (`bg-background`, `text-brand`, `glow-card`…).

| Token | Tối (mặc định) | Sáng | Dùng cho |
|---|---|---|---|
| `--bg-gradient` | `#0b1620 → #08111a` | `#ffffff → #eef8f3` | Nền trang |
| `--brand` | `#13D95C` (từ `site.json › accentColor`) | như trên | Màu nhấn gốc (xanh lá Vietapp) |
| `--brand-2` | `#2196DF` | như trên | Đầu xanh dương của gradient |
| `--brand-gradient` | `#13D95C → #2196DF` | như trên | Trang trí: gạch chân navbar, vòng nút liên hệ, thanh cuộn. **Không đặt chữ trắng lên** (tương phản 1.9:1) |
| `--primary-gradient` (`bg-primary-gradient`) | `#08843F → #1062DD` | như trên | Nút chính, tab đang chọn, avatar chữ viết tắt — chữ trắng đạt AA (≥ 4.79:1) |
| `--brand-ink` (`text-brand`) | `= --brand` | `--brand` trộn 58% với đen | Chữ/nhấn — bản sáng đậm hơn để đạt tương phản AA |
| `--foreground` | `#ffffff` | `#1d2939` | Chữ chính |
| `--secondary-foreground` | `#a9bccb` | `#4F5662` (xám Vietapp) | Chữ phụ |
| `--faint` | `#7f97a8` | `#667085` (xám Vietapp) | Chữ mờ, số đếm |
| `--card` | `#0d1b26` | `#ffffff` | Card |
| `--primary` | `#1062DD` | `#1062DD` | Màu nền dự phòng dưới `--primary-gradient` |
| `--footer` | `#050c12` | `#e8f4ef` | Footer |
| `--nav-scrolled` | `rgba(11,22,32,.72)` + blur 15px | `rgba(255,255,255,.85)` | Navbar khi cuộn |
| `--glow` / `--glow-strong` | bóng xanh dương / hover bóng xanh lá | bóng nhẹ cùng tông | Card phát sáng |
| `--star` | trắng | xanh dương | Màu sao trên canvas |

Trang Resume luôn là "tờ giấy trắng" (chữ xám đậm, tiêu đề mục có 3 chữ đầu màu xanh lá đậm `#08843F`) ở cả hai theme và khi in.

## Typography

- Theo Vietapp: **Quicksand** (variable, độ đậm mặc định 500 vì 400 quá mảnh) cho chữ thường; **Lexend** cho `h1`–`h5`, `b`/`strong` và nhãn nhỏ (`font-mono`, vì bộ font này không có font đơn cách). Cả hai có subset `vietnamese` + `latin-ext`, tải qua `next/font/google` lúc build (tự host, không gọi Google khi người xem mở trang).
- Ảnh Open Graph vẫn dùng **Inter** (`@fontsource/inter`), vì trình vẽ ảnh cần file font `.woff` có sẵn trong `node_modules`.
- Tiêu đề section: `font-medium`, ~2.3rem, căn giữa; **một từ màu nhấn** bằng cú pháp `*từ*` trong nội dung (component `Accent`).
- Từ khóa công nghệ trong đoạn giới thiệu tự động in đậm nghiêng màu nhấn (component `Emphasize`, lấy từ `profile.coreStack`).
- Resume dùng font sans của hệ thống (Segoe UI/Roboto) để giống CV in.

## Bố cục

- **Navbar** cố định trên cùng: logo `TH.` (màu nhấn, đậm) · Home / About / Projects / Resume (icon + gạch chân gradient xanh lá → xanh dương chạy ra khi hover/trang hiện tại) · tìm kiếm (`Ctrl/⌘ K`) · EN|VI · sáng/tối. Trong suốt ở đầu trang, mờ + đổ bóng khi cuộn. Dưới `lg`: nút hamburger 3 vạch màu nhấn (chuyển thành ✕), menu xổ xuống căn giữa.
- **Home**: Hero 2 cột (lời chào + vẫy tay, "I'M <TÊN>", vai trò gõ chữ, minh họa SVG) → "Let me *introduce* myself" (thông điệp + giới thiệu, avatar tròn nghiêng nhẹ khi hover) → Highlights (4 card phát sáng) → "Find Me On" (nút tròn trắng).
- **About**: "Beyond the *Code*" (câu chào tự sinh từ dữ liệu, giới thiệu đầy đủ, sở thích có icon chỉ tay, câu trích dẫn) + minh họa → Skillset (pill bo tròn theo nhóm, có icon nhóm) → Career Journey (timeline card phát sáng) → Education.
- **Projects**: tiêu đề + bộ lọc dạng pill + ô tìm kiếm bo tròn → lưới 3 cột card (khung laptop chứa minh họa, tiêu đề giữa, mô tả căn đều, nút gradient) → Interactive System Explorer.
- **Resume**: nút Download CV (nếu có PDF) hoặc In / Lưu PDF, tờ CV trắng ở giữa.
- **Footer** 3 cột: "Designed and Developed by …" · Copyright · icon liên hệ.
- Nội dung tối đa 1320px; khoảng đệm 24–40px.

## Thành phần & hiệu ứng

| Thành phần | File |
|---|---|
| Navbar, footer, nền sao (canvas tự viết) | `src/components/layout/navbar.tsx`, `site-shell.tsx`, `star-field.tsx` |
| Tiêu đề có từ nhấn, nhấn từ khóa | `src/components/accent.tsx` |
| Hero gõ chữ, minh họa SVG | `src/components/sections/typewriter.tsx`, `hero-art.tsx` |
| Card dự án | `src/components/projects/project-card.tsx` |
| Utility CSS: `glow-card`, `glow-card-hover`, `bg-primary-gradient`, `tech-pill`, `social-circle`, `nav-underline`, `wave`, `tilt`, `float-chip` | `src/app/globals.css` |

Chuyển động: sao trôi/lấp lánh, tay vẫy, con trỏ nhấp nháy, chip trôi nhẹ quanh minh họa, card phóng 1.02 khi hover. Với `prefers-reduced-motion`: sao đứng yên, typewriter hiện sẵn vai trò đầu, mọi animation CSS tắt.

## Ngôn ngữ

- English (US) mặc định tại `/`, Tiếng Việt tại `/vi`; nút **EN | VI** trong navbar; lựa chọn được ghi nhớ.
- Ngày tháng: EN `Aug 2025 – Present`, VI `08/2025 – Hiện tại`.

## Accessibility

- Mỗi trang một H1; skip link; navbar là `<header>`/`<nav>`, nút hamburger có `aria-expanded`/`aria-controls`.
- Focus ring 2px màu nhấn; minh họa SVG có `role="img"` + mô tả; canvas sao `aria-hidden`.
- Typewriter có bản đầy đủ cho trình đọc màn hình (`sr-only`), phần gõ chữ `aria-hidden`.
- Lighthouse Accessibility 100 ở các trang chính (đo ngày build).

## Lịch sử thay đổi

### 2026-11-21: Đổi tông màu và font theo Vietapp

Mục tiêu: dùng tông màu chủ đạo và font chữ của [vietapp.vn](https://vietapp.vn/) (lấy trực tiếp từ CSS của trang); giữ nguyên bố cục, Dark/Light (mặc định tối), song ngữ và toàn bộ nội dung.

| Hạng mục | Trước | Sau |
|---|---|---|
| Màu nhấn (`site.json › accentColor`) | Tím `#C770F0` | Xanh lá `#13D95C` |
| Gradient chủ đạo | Không có | `#13D95C → #2196DF` (trang trí), `#08843F → #1062DD` (nút có chữ trắng) |
| Nền tối | Tím đêm `#1b1429` | Xanh navy `#0b1620` |
| Nền sáng | Lavender `#faf7fd` | Trắng → xanh lá rất nhạt `#ffffff → #eef8f3` |
| Chữ phụ (sáng) | `#5d4f70` | Xám Vietapp `#4F5662`, `#667085` |
| Nút chính, tab đang chọn, avatar | Tím `#623686` / `#8e44ad` | Gradient `#08843F → #1062DD` |
| Gạch chân navbar, vòng nút liên hệ, thanh cuộn | Tím | Gradient xanh lá → xanh dương |
| Font | JetBrains Mono cho mọi chữ | Quicksand (chữ thường), Lexend (tiêu đề, chữ đậm, nhãn nhỏ) |
| Tiêu đề mục trang Resume | Hồng `#e8336d` | Xanh lá đậm `#08843F` |
| Favicon, `theme-color`, ảnh Open Graph | Nền tím, chữ tím | Nền navy, chữ/điểm nhấn xanh lá |

Khả năng tiếp cận: gradient tươi của Vietapp chỉ đạt 1.9:1 với chữ trắng, nên nút dùng bản đậm hơn cùng tông (chữ trắng đạt ≥ 4.79:1). Mọi cặp chữ/nền mới đạt WCAG AA.

File đã sửa: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/icon.svg`, `src/lib/og.tsx`, `content/site.json`, `src/components/ui/button.tsx`, `src/components/projects/project-card.tsx`, `src/components/pages/resume-actions.tsx`, `src/components/pages/resume.tsx`, `src/components/diagrams/featured-systems.tsx`, `src/components/layout/avatar.tsx`, `src/components/accent.tsx` (chú thích), `DESIGN_SYSTEM.md`, `README.md`.
