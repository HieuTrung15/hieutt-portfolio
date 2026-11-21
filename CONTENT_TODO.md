# Nội dung cần bổ sung trước khi publish

Website đã chạy với dữ liệu từ CV. Các mục dưới đây đang **trống, ẩn hoặc được đánh dấu "đang bổ sung"** — không có dữ liệu giả nào được điền vào chỗ trống. Cách cập nhật: `pnpm studio` (chi tiết trong [CONTENT_MANAGEMENT.md](CONTENT_MANAGEMENT.md)).

## Checklist

- [ ] **Bổ sung ảnh chân dung chuyên nghiệp** — Studio › Hồ sơ cá nhân › Ảnh đại diện. Hiện đang hiển thị chữ viết tắt "TH".
- [ ] **Bổ sung ảnh chụp màn hình dự án được phép công bố** — Studio › Dự án › Ảnh minh họa / Thư viện ảnh. Hiện dùng hình minh họa sinh từ dữ liệu; chỉ dùng ảnh đã được phép và đã che dữ liệu nhân sự/khách hàng.
- [ ] **Bổ sung sơ đồ nghiệp vụ hoặc kiến trúc đã xác thực** — Studio › Dự án › Sơ đồ hệ thống. 4 sơ đồ hiện có (VHRM, EUP Group, Helencare, HBG) đều là `conceptual`; chỉ đổi sang `documented` khi có kiến trúc thực tế được xác nhận.
- [ ] **Bổ sung 1–2 vấn đề kỹ thuật tiêu biểu từng giải quyết** — viết thêm vào case study Markdown (vd mục `## Thách thức kỹ thuật`).
- [ ] **Bổ sung kết quả dự án hoặc số liệu được xác nhận** — Studio › Dự án › Kết quả & đóng góp. Hiện chỉ có phạm vi công việc, không có số liệu hiệu quả.
- [x] **Bổ sung GitHub URL** — đã thêm https://github.com/HieuTrung15 (cùng Facebook).
- [x] **Bổ sung LinkedIn URL** — đã thêm.
- [ ] **Bổ sung CV PDF** — Studio › Cài đặt website › File CV (PDF). Nút "Tải CV" đang ẩn.
- [ ] **Xác nhận email công khai** — hiện dùng `hieutrungvietnam0107@gmail.com` (Sidebar, Contact, JSON-LD).
- [ ] **Bổ sung mô tả riêng cho YBM ERP** — hiện chỉ có tên dự án và giai đoạn công tác tại NXCOM; trang hiển thị "đang bổ sung". Cần: phạm vi, phân hệ, trách nhiệm, công nghệ, thời gian thực tế (viết cả EN và VI).
- [ ] **Bổ sung mô tả riêng cho HRMSND** — hiện chỉ có tên dự án; chưa gán danh mục, kỹ năng, công nghệ.
- [ ] **Bổ sung thông tin công nghệ và chức năng của website quản lý hạ tầng cấp nước** — hiện chỉ có mô tả một câu; chưa có vị trí, thời gian, công nghệ.
- [ ] **Kiểm tra quyền công khai tên khách hàng, hình ảnh và tài liệu dự án** — đặc biệt EUP Group, Helencare, HBG, YBM.
- [x] **Cấu hình domain production** — `https://henry-tran.is-a.dev`.
- [x] **Deploy lên Cloudflare Pages** — đang chạy tại https://henry-tran.pages.dev; domain henry-tran.is-a.dev đã gắn vào project (chờ DNS).
- [ ] **Chờ duyệt PR đăng ký henry-tran.is-a.dev** — đã mở https://github.com/is-a-dev/register/pull/62252 (2026-11-21), 4/4 check đạt; sau khi merge kiểm tra https://henry-tran.is-a.dev và trạng thái Custom domains trên Cloudflare.
- [ ] **Kiểm tra lại toàn bộ nội dung tiếng Việt trước khi publish** — đặc biệt các đoạn giới thiệu/About và case study do hệ thống soạn từ CV.
- [ ] **Duyệt bản tiếng Anh (mặc định của website)** — toàn bộ nội dung tiếng Anh được dịch từ bản tiếng Việt/CV; đọc lại giọng văn Hero, About, case study (`content/case-studies/*.en.md`).
- [ ] **Xác nhận tên tiếng Anh chính thức của công ty** — đang dùng bản dịch: "NXCOM Technology Joint Stock Company", "Lotusa Technology Solutions Joint Stock Company"; "Vietnam National Textile and Garment Group" và "Hanoi University of Industry" là tên tiếng Anh thông dụng.

## Ghi chú thêm (phát hiện khi chuyển CV thành website)

- [ ] **Database cho VHRM** — CV ghi "database technologies phù hợp"; chưa xác nhận MariaDB/MySQL nên chưa liệt kê.
- [ ] **Frappe Framework cho Helencare** — CV liệt kê ERPNext nhưng không ghi Frappe; chưa gắn kỹ năng Frappe cho dự án này.
- [ ] **Vị trí ReactJS trong Helencare** — CV liệt kê ReactJS nhưng không nói dùng cho phần nào; sơ đồ chưa gắn ReactJS vào node nào.
- [ ] **Kỹ năng chưa gắn dự án**: HTML, CSS, Business Process Standardization — vẫn hiển thị trong Expertise, khi chọn sẽ báo "chưa có dự án". Gắn vào dự án nếu phù hợp.
- [ ] **Lĩnh vực (industry) của EUP Group và HBG** — chưa có trong CV nên ô "Lĩnh vực" được ẩn.
- [ ] **Đoạn About** (`profile.about.body`) được viết lại từ CV — đọc lại và chỉnh giọng văn cho đúng ý bạn.
- [ ] **Build lại ít nhất mỗi năm** để số năm kinh nghiệm (`{years}`) và năm ở footer được cập nhật (giá trị tính lúc build).
