# Design System — HieuTT Portfolio

**Purple night portfolio**: nền tím đêm có sao chuyển động, chữ đơn cách (monospace), màu nhấn tím, card phát sáng. Phong cách lấy cảm hứng từ [soumyajit.vercel.app](https://soumyajit.vercel.app/) — bố cục và hiệu ứng được viết lại hoàn toàn; không dùng mã nguồn, ảnh minh họa, avatar hay icon của trang đó (repo gốc không có license). Có bản sáng (lavender) qua nút đổi theme; **mặc định là tối**.

## Màu (design tokens)

Định nghĩa trong `src/app/globals.css` (`:root` = sáng, `.dark` = tối), dùng qua Tailwind (`bg-background`, `text-brand`, `glow-card`…).

| Token | Tối (mặc định) | Sáng | Dùng cho |
|---|---|---|---|
| `--bg-gradient` | `#1b1429 → #140f23` | `#faf7fd → #f1eafa` | Nền trang |
| `--brand` | `#C770F0` (từ `site.json › accentColor`) | như trên | Màu nhấn gốc |
| `--brand-ink` (`text-brand`) | `= --brand` | `--brand` trộn 62% với đen (≈ #7b4596) | Chữ/nhấn — bản sáng đậm hơn để đạt tương phản AA |
| `--foreground` | `#ffffff` | `#1d1430` | Chữ chính |
| `--secondary-foreground` | `#b9a9cf` | `#5d4f70` | Chữ phụ |
| `--card` | `#170f26` | `#ffffff` | Card |
| `--primary` | `#623686` | `#623686` | Nút (Case Study, Download/Print CV) |
| `--footer` | `#0a0416` | `#ece4f6` | Footer |
| `--nav-scrolled` | `rgba(27,26,46,.66)` + blur 15px | `rgba(250,247,253,.8)` | Navbar khi cuộn |
| `--glow` / `--glow-strong` | `0 4px 5px 3px rgba(119,53,136,.46)` / hover mạnh hơn | bóng tím nhẹ | Card phát sáng |
| `--star` | trắng | tím | Màu sao trên canvas |

Trang Resume luôn là "tờ giấy trắng" (chữ xám đậm, tiêu đề mục có 3 chữ đầu màu hồng `#e8336d`) ở cả hai theme và khi in.

## Typography

- Một họ font duy nhất: **JetBrains Mono** (variable, có subset `vietnamese` + `latin-ext`), cho mọi chữ.
- Tiêu đề section: `font-medium`, ~2.3rem, căn giữa; **một từ màu nhấn** bằng cú pháp `*từ*` trong nội dung (component `Accent`).
- Từ khóa công nghệ trong đoạn giới thiệu tự động in đậm nghiêng màu nhấn (component `Emphasize`, lấy từ `profile.coreStack`).
- Resume dùng font sans của hệ thống (Segoe UI/Roboto) để giống CV in.

## Bố cục

- **Navbar** cố định trên cùng: logo `TH.` (tím, đậm) · Home / About / Projects / Resume (icon + gạch chân tím chạy ra khi hover/trang hiện tại) · tìm kiếm (`Ctrl/⌘ K`) · EN|VI · sáng/tối. Trong suốt ở đầu trang, mờ + đổ bóng khi cuộn. Dưới `lg`: nút hamburger 3 vạch tím (chuyển thành ✕), menu xổ xuống căn giữa.
- **Home**: Hero 2 cột (lời chào + vẫy tay, "I'M <TÊN>", vai trò gõ chữ, minh họa SVG) → "Let me *introduce* myself" (thông điệp + giới thiệu, avatar tròn nghiêng nhẹ khi hover) → Highlights (4 card phát sáng) → "Find Me On" (nút tròn trắng).
- **About**: "Beyond the *Code*" (câu chào tự sinh từ dữ liệu, giới thiệu đầy đủ, sở thích có icon chỉ tay, câu trích dẫn) + minh họa → Skillset (pill bo tròn theo nhóm, có icon nhóm) → Career Journey (timeline card phát sáng) → Education.
- **Projects**: tiêu đề + bộ lọc dạng pill + ô tìm kiếm bo tròn → lưới 3 cột card (khung laptop chứa minh họa, tiêu đề giữa, mô tả căn đều, nút tím) → Interactive System Explorer.
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
| Utility CSS: `glow-card`, `glow-card-hover`, `tech-pill`, `social-circle`, `nav-underline`, `wave`, `tilt`, `float-chip` | `src/app/globals.css` |

Chuyển động: sao trôi/lấp lánh, tay vẫy, con trỏ nhấp nháy, chip trôi nhẹ quanh minh họa, card phóng 1.02 khi hover. Với `prefers-reduced-motion`: sao đứng yên, typewriter hiện sẵn vai trò đầu, mọi animation CSS tắt.

## Ngôn ngữ

- English (US) mặc định tại `/`, Tiếng Việt tại `/vi`; nút **EN | VI** trong navbar; lựa chọn được ghi nhớ.
- Ngày tháng: EN `Aug 2025 – Present`, VI `08/2025 – Hiện tại`.

## Accessibility

- Mỗi trang một H1; skip link; navbar là `<header>`/`<nav>`, nút hamburger có `aria-expanded`/`aria-controls`.
- Focus ring 2px màu nhấn; minh họa SVG có `role="img"` + mô tả; canvas sao `aria-hidden`.
- Typewriter có bản đầy đủ cho trình đọc màn hình (`sr-only`), phần gõ chữ `aria-hidden`.
- Lighthouse Accessibility 100 ở các trang chính (đo ngày build).
