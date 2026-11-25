# Hướng dẫn quản lý nội dung

Mọi nội dung của website nằm trong thư mục `content/`. Có hai cách cập nhật — cả hai đều ghi vào cùng các file này:

1. **HieuTT Content Studio** (khuyên dùng): giao diện form, tự kiểm tra hợp lệ, có xem trước.
2. **Sửa file trực tiếp** (JSON + Markdown) bằng VS Code.

Không cần sửa code giao diện (JSX) để thêm dự án, công ty, kỹ năng hay đổi nội dung giới thiệu.

## 0. Song ngữ: English (mặc định) và Tiếng Việt

- Website tiếng Anh ở `/`, tiếng Việt ở `/vi`.
- Trường có thể dịch được lưu dạng `{ "en": "…", "vi": "…" }`; danh sách dịch được lưu dạng `{ "en": ["…"], "vi": ["…"] }` (hai danh sách độc lập, mỗi dòng một mục).
- Trong Studio, các trường này hiện **hai ô EN và VI cạnh nhau**. Chỉ cần điền ít nhất một ngôn ngữ để lưu được; ngôn ngữ còn thiếu sẽ hiển thị bằng ngôn ngữ kia, và Studio liệt kê "⚠ … mục chưa dịch đủ" sau khi Kiểm tra/Lưu.
- Trường trung lập (tên, chức danh, công nghệ, tên kỹ năng, tên phân hệ, nhãn node sơ đồ, ngày tháng) chỉ có một giá trị dùng chung.
- Case study: mỗi ngôn ngữ một file `content/case-studies/<slug>.en.md` và `<slug>.vi.md` (Studio có hai ô soạn tương ứng).
- Chữ giao diện cố định (nút, nhãn như "Explore projects", "Copy email") nằm trong `src/lib/i18n.ts`.
- Xem trước: nút **EN | VI** ở khung xem trước của Studio chuyển website dev và bản xem trước Markdown sang ngôn ngữ tương ứng.

---

## 1. Dùng Content Studio

```bash
pnpm studio
```

- Studio: <http://127.0.0.1:4321>
- Website dev (khởi động kèm): <http://127.0.0.1:3000>

Studio chỉ chạy trên máy của bạn (bind `127.0.0.1`), không có trong bản production.

### Quy trình chuẩn

1. Chọn nhóm nội dung ở cột trái (Hồ sơ, Cài đặt website, Highlights, Dự án, Kinh nghiệm, Kỹ năng, Học vấn, Social links).
2. Sửa trong form. Dòng **● Có thay đổi chưa lưu** xuất hiện khi có thay đổi.
3. **Kiểm tra** — hiển thị toàn bộ lỗi (ví dụ: email sai, dự án published thiếu tóm tắt, kỹ năng không tồn tại).
4. **Xem trước**:
   - Tab *Case study* (khi ở mục Dự án): Markdown được render ngay khi gõ.
   - Tab *Website (dev)*: hiển thị trang tương ứng sau khi lưu (chọn EN/VI để xem từng ngôn ngữ). Muốn xem trước một dự án mà chưa công khai, để trạng thái **draft** rồi lưu — draft chỉ hiện ở bản dev.
5. **Lưu vào file** (hoặc `Ctrl + S`). Studio chỉ ghi khi toàn bộ nội dung hợp lệ, chỉ ghi file thay đổi, và sao lưu bản cũ vào `.studio-backups/<thời-gian>/`.
6. Website dev tự hiển thị nội dung mới khi tải lại trang.
7. Xuất bản: `pnpm build` rồi deploy thư mục `out/` (xem README).

Các nút khác: **Hoàn tác** (bỏ thay đổi chưa lưu), **Xuất backup** (tải file JSON chứa toàn bộ nội dung đã lưu).

Nếu sửa file bằng tay trong lúc Studio đang mở, lần lưu tiếp theo sẽ bị từ chối để tránh ghi đè — tải lại trang Studio.

---

## 2. Các tác vụ thường gặp

### Cập nhật profile

Studio → **Hồ sơ cá nhân**, hoặc file `content/profile.json`:

| Trường | Hiển thị ở |
|---|---|
| `name`, `title`, `location` | Hero, About, Resume, OG image |
| `greeting` | Lời chào Hero (vd "Hi There!") |
| `eyebrow` | Các vai trò cho hiệu ứng gõ chữ ở Hero, cách nhau bằng `·` |
| `statement`, `intro` | Phần "Let me introduce myself" (đoạn văn cách nhau bằng một dòng trống) |
| `tagline` | Footer, OG image |
| `email` | Find Me On, footer, Resume, Command Palette |
| `careerStart` (`YYYY-MM`) | Tự tính "{years}+ Years" |
| `coreStack` | Chip quanh minh họa Hero; các từ này được tô màu trong đoạn giới thiệu |
| `about.heading/statement/body` | Trang `/about` (tiêu đề hỗ trợ `*từ*` để tô màu) |
| `interests`, `contact.heading/description` | About, Contact |

### Thay avatar

Studio → Hồ sơ cá nhân → **Ảnh đại diện** → chọn file (PNG/JPG/WEBP, ≤ 10 MB) → Lưu. Ảnh được lưu vào `public/uploads/`.
Cách thủ công: chép ảnh vào `public/uploads/avatar.jpg`, đặt `"avatar": "/uploads/avatar.jpg"`. Để trống ⇒ hiển thị chữ viết tắt "TH".

### Thêm dự án

Studio → **Dự án** → **+ Dự án mới** → nhập slug (vd `erp-moi`, chỉ chữ thường, số, gạch ngang; không đổi được sau khi tạo).

Dự án mới ở trạng thái **draft**. Chỉ `slug` và `title` là bắt buộc nên có thể lưu khi còn thiếu thông tin. Để công khai: điền **Tóm tắt (card)** rồi đổi trạng thái thành **published**.

Các trường chính: tổ chức, lĩnh vực, vị trí, thời gian (để trống ⇒ website hiển thị giai đoạn công tác của công ty có chứa dự án), danh mục lọc, công nghệ, kỹ năng liên quan, trách nhiệm (kèm loại: *development / team / management / operations*), phân hệ, kết quả & đóng góp, ảnh, sơ đồ hệ thống, `featured` (hiện ở trang chủ), `order` (thứ tự; dùng nút ↑ ↓ trong danh sách).

Cách thủ công: tạo `content/projects/<slug>.json` (trường `slug` phải trùng tên file):

```json
{
  "slug": "erp-moi",
  "title": "New ERP Project",
  "status": "draft",
  "order": 8,
  "organization": { "en": "Organization name", "vi": "Tên tổ chức" },
  "summary": { "en": "One or two sentences for the card.", "vi": "1–2 câu tóm tắt cho card." }
}
```

Đừng quên thêm slug vào `projects` của công ty tương ứng trong `experience.json` (Studio → Kinh nghiệm → Dự án liên quan) để dự án xuất hiện trên timeline.

### Viết case study

Studio → Dự án → hai ô **Case study — Business context (EN / VI, Markdown)**, hoặc các file `content/case-studies/<slug>.en.md` và `content/case-studies/<slug>.vi.md`.

- Viết đoạn văn bình thường; `**đậm**`, danh sách `- …`, trích dẫn `> …`, tiêu đề `## …`, bảng đều được hỗ trợ.
- HTML trong Markdown bị bỏ qua (an toàn).
- Chỉ viết thông tin đã xác nhận. Không mô tả "vấn đề ban đầu" nếu không có thật.

### Sơ đồ hệ thống (Interactive System Explorer)

Trong form dự án → **+ Thêm Sơ đồ hệ thống**:

- `kind`: `conceptual` (minh họa theo phạm vi dự án — website ghi rõ *Conceptual workflow based on documented project scope.*) hoặc `documented` (chỉ dùng khi đã có kiến trúc thực tế được xác thực).
- **Nodes**: `id`, nhãn, mô tả, icon, vị trí `x`, `y` (0–100, tính theo phần trăm khung sơ đồ), công nghệ, chức năng phụ trách.
- **Edges**: chọn node đầu/cuối và nhãn (vd `Work Order`).
- Mẹo bố cục: hàng trên `y ≈ 18`, hàng dưới `y ≈ 82`, các node cùng hàng cách nhau ≥ 24 đơn vị `x`.

### Thêm công ty

Studio → **Kinh nghiệm** → **+ Thêm mục**. Điền ID (vd `cong-ty-moi`), công ty, tên ngắn, chức danh, bắt đầu/kết thúc (tích **Hiện tại** nếu đang làm), công việc (mỗi dòng một mục), dự án liên quan. Dùng ↑ ↓ để sắp xếp (mới nhất ở trên). Số "Companies" ở Highlights tự cập nhật.

### Thêm kỹ năng

Studio → **Kỹ năng** → phần *Kỹ năng* → **+ Thêm mục**: ID, tên, nhóm (chọn từ danh sách), icon, hiển thị. Đổi nhóm bằng ô *Nhóm*; sắp xếp nhóm/kỹ năng bằng ↑ ↓; bỏ tích *Hiển thị* để ẩn.

**Icon**: chọn trong danh sách — logo thương hiệu (`erpnext`, `frappe`, `odoo`, `python`, `mysql`, `mariadb`, `postgresql`, `javascript`, `react`, `html5`, `css`, `jinja`, hiển thị đúng màu thương hiệu) hoặc biểu tượng chung (`factory`, `warehouse`, `truck`, `users`, `database`, `plug`…). Để trống thì dùng icon của nhóm. Muốn thêm logo khác: thêm key vào `src/lib/skill-icons.ts` và icon tương ứng (từ `simple-icons` hoặc `lucide-react`) vào `src/components/skill-icon.tsx`.

### Liên kết kỹ năng với dự án

Liên kết được khai báo **trong dự án**: Studio → Dự án → chọn dự án → **Kỹ năng liên quan** → tích các kỹ năng. Bộ lọc ở section Expertise và trang case study tự cập nhật. Chỉ liên kết khi dự án thực sự dùng kỹ năng đó.

### Cập nhật social links

Studio → **Social links**, hoặc `content/social-links.json` (dùng chung cho hai ngôn ngữ). Điền URL `https://…` cho GitHub/LinkedIn/Website. URL trống ⇒ liên kết tự ẩn. Thêm loại khác bằng **+ Thêm mục** (loại `other`).

### Heatmap GitHub Contributions

Lưới đóng góp 12 tháng gần nhất trên trang About, ngay trước *Professional Skillset*.

- **Dữ liệu**: `src/data/github-contributions.json` là **file sinh ra tự động — đừng sửa tay**.
  Mọi thay đổi bằng tay sẽ bị ghi đè ở lần đồng bộ sau.
- **Làm mới**: `pnpm sync:github`. CI cũng tự chạy trước mỗi lần deploy, nên website luôn hiện số
  liệu mới nhất mà không cần bạn làm gì.
- **Tài khoản nào**: lấy từ URL GitHub trong **Social links**. Đổi URL đó là đổi luôn heatmap.
- **Tắt đi**: Studio → *Cài đặt website* → *Các section* → bỏ tích **Hiển thị** ở section `github`.
- **Số liệu gồm cả private**: con số chỉ đúng khi bật *Private contributions* trong GitHub →
  *Contribution settings*. Tắt đi thì heatmap chỉ còn các đóng góp công khai.

Hai giới hạn đã biết và chấp nhận:

- Bản xem thử ở máy (`pnpm preview`) hiển thị snapshot đã commit, nên có thể cũ hơn website thật.
  Chạy `pnpm sync:github` trước nếu muốn xem số mới.
- Nếu file dữ liệu không có, section tự biến mất khỏi trang — nhưng ô tìm kiếm (`Ctrl/⌘ K`) vẫn
  còn mục "GitHub". Trường hợp này chỉ xảy ra khi checkout thiếu file.

### Thay đổi màu sắc và cài đặt website

Studio → **Cài đặt website**:

- **Màu nhấn (accent)**: chọn màu; toàn bộ highlight, liên kết, sơ đồ dùng màu này.
- **Logo text**, **Tiêu đề / mô tả SEO**, **Domain production**.
- **Nhãn menu (navbar)**: Home / About / Projects / Resume cho từng ngôn ngữ.
- **Các section**: đổi tiêu đề, mô tả; bỏ tích *Hiển thị* để ẩn; dùng ↑ ↓ để đổi thứ tự trong trang. Bọc một từ trong `*dấu sao*` để tô màu nhấn (vd `Professional *Skillset*`). Section thuộc trang: Home = `home`, `about`, `highlights`, `contact`; About = `github`, `expertise`, `experience`, `education`; Projects = `work` (tiêu đề/mô tả của trang).
- **Danh mục dự án**: tên các bộ lọc ở trang Projects (danh mục không có dự án sẽ tự ẩn).
- **File CV (PDF)**: tải PDF lên ⇒ nút "Tải CV" xuất hiện ở Hero, Contact và trang Hồ sơ. Để trống ⇒ nút bị ẩn.

Màu nền, chữ, viền… nằm trong `src/app/globals.css` (xem DESIGN_SYSTEM.md).

### Highlights

Studio → **Highlights**. Trường *Giá trị* hỗ trợ:

- `{years}` — số năm tính từ `careerStart` (tính lúc build; build lại định kỳ để số luôn đúng).
- `{companies}` — số công ty trong Kinh nghiệm.

Chỉ dùng số liệu có cơ sở; không thêm chỉ số chưa được xác nhận.

---

## 3. Xuất bản nội dung đã sửa

```bash
pnpm test     # (khuyến nghị) kiểm tra nội dung + Studio
pnpm build    # build production — dừng lại nếu nội dung không hợp lệ
pnpm preview  # xem bản build tại http://127.0.0.1:4173
```

Sau đó deploy thư mục `out/` (Vercel: push lên git là tự build). Dự án `draft` không bao giờ xuất hiện trong bản build.

## 4. Khi có lỗi

- Build báo `Nội dung không hợp lệ:` kèm danh sách — mỗi dòng có tên file và trường bị lỗi, ví dụ `projects/vhrm.json › summary: Dự án published cần có tóm tắt`.
- Khôi phục bản cũ: sao chép file từ `.studio-backups/<thời-gian>/` về `content/` (hoặc dùng git).
