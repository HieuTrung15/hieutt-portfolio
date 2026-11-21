# Deploy lên Cloudflare Pages và CI/CD với GitHub Actions

Hướng dẫn làm lại từ đầu, dùng giá trị thật của project này. Áp dụng cho project khác chỉ cần đổi tên.

## Cách CI/CD hoạt động

```
git push → GitHub Actions (một máy Linux mới mỗi lần) → cài, build, test → wrangler tải out/ lên → Cloudflare Pages → website
```

Có hai cách nối GitHub với Cloudflare:

| | Cách A: Cloudflare tự build (*Connect to Git*) | Cách B: GitHub Actions + Direct Upload (đang dùng) |
|---|---|---|
| Ai build | Cloudflare | GitHub |
| Chạy test trước khi deploy | Không | Có: test lỗi thì không deploy |
| Dùng được cho project tạo bằng Direct Upload | Không, phải tạo project mới | Có |

Project `henry-tran` được tạo bằng Direct Upload, nên phải dùng cách B. Các bước dưới đây là cách B.

## Phần 1: Deploy lên Cloudflare lần đầu (làm một lần)

**Bước 1: Kiểm tra build được ở máy**

```bash
pnpm install
pnpm build      # tạo thư mục out/
pnpm test
```

**Bước 2: Khai báo project cho wrangler.** File [`wrangler.toml`](../wrangler.toml) ở thư mục gốc:

```toml
name = "henry-tran"                 # tên project trên Cloudflare, quyết định địa chỉ henry-tran.pages.dev
pages_build_output_dir = "./out"    # thư mục sẽ được tải lên
compatibility_date = "2026-11-01"
```

**Bước 3: Đăng nhập và tạo project**

```bash
npx wrangler@4 login                                                     # mở trình duyệt, bấm Allow
npx wrangler@4 pages project create henry-tran --production-branch main
```

Nếu lệnh tạo project báo lỗi *"Missing entry-point"*, chạy lại một lần với `--force` thêm vào cuối. Wrangler bản mới hay nhầm Pages thành Workers.

**Bước 4: Deploy tay lần đầu**

```bash
pnpm run deploy:cloudflare
```

Sau bước này website chạy tại `https://henry-tran.pages.dev`.

## Phần 2: Đưa code lên GitHub (làm một lần)

**Bước 5: Tạo repo trống** tại <https://github.com/new>. **Không** tick *Add a README* hay *.gitignore*, vì repo phải trống thì mới push được lần đầu.

**Bước 6: Kiểm tra `.gitignore`** đã loại `node_modules/`, `.next/`, `out/`, `.wrangler/`, `.env*`. Không bao giờ đưa token hay mật khẩu lên repo.

**Bước 7: Push**

```bash
git init -b main
git add -A
git status                     # đọc lại danh sách file trước khi commit
git commit -m "Initial commit"
git remote add origin https://github.com/HieuTrung15/hieutt-portfolio.git
git push -u origin main
```

## Phần 3: Tạo CI/CD

**Bước 8: Viết file workflow.** GitHub tự chạy mọi file `.yml` đặt trong `.github/workflows/`. File của project là [`deploy.yml`](../.github/workflows/deploy.yml):

```yaml
name: Deploy                      # tên hiển thị trong tab Actions

on:                               # KHI NÀO chạy
  push:
    branches: [main]              #   mỗi lần push lên nhánh main
  workflow_dispatch:              #   và khi bấm nút "Run workflow" bằng tay

concurrency:                      # hai lần push sát nhau thì xếp hàng, không deploy chồng lên nhau
  group: deploy-production
  cancel-in-progress: false

permissions:
  contents: read                  # workflow chỉ được ĐỌC code, không sửa được repo

jobs:
  deploy:
    runs-on: ubuntu-latest        # GitHub cấp một máy Linux mới tinh
    steps:                        # chạy lần lượt; một bước lỗi thì dừng toàn bộ
      - uses: actions/checkout@v7       # tải code về máy đó
      - uses: pnpm/action-setup@v6      # cài pnpm (đọc phiên bản từ package.json)
      - uses: actions/setup-node@v7     # cài Node 22, nhớ cache pnpm cho lần sau nhanh hơn
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile   # cài đúng phiên bản trong pnpm-lock.yaml
      - run: pnpm build                       # CI: build
      - run: pnpm typecheck                   # CI: kiểm tra kiểu TypeScript
      - run: pnpm lint                        # CI: kiểm tra code
      - run: pnpm test                        # CI: chạy test
      - name: Deploy to Cloudflare Pages      # CD: chỉ chạy khi mọi bước trên đều qua
        run: npx --yes wrangler@4 pages deploy --branch main
        env:                                  # lấy secret từ GitHub, đưa vào wrangler
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN_PORTFOLIO }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

Ở bước 4 bạn đăng nhập wrangler bằng trình duyệt. Máy của GitHub không làm vậy được, nên nó cần token, và đó là việc của bước 9–11.

**Bước 9: Tạo API token trên Cloudflare**

1. Mở <https://dash.cloudflare.com/profile/api-tokens>, bấm **Create Token**, rồi **Start from scratch**.
2. Điền:
   - **Tên token**: `github-actions-henry-tran`
   - **Policy**: chọn **Account**, rồi chọn tài khoản của bạn
   - **Quyền**: **Cloudflare Pages**, mức **Edit**
   - **Token expiration** và **Client IP Address Filtering**: để trống. GitHub Actions không có IP cố định, và token hết hạn thì deploy sẽ lỗi.
3. Bấm **Continue to summary**, rồi **Create Token**.
4. Bấm **Copy**. Token chỉ hiện một lần.

**Bước 10: Lấy Account ID**

```bash
npx wrangler@4 whoami      # bảng kết quả có cột "Account ID"
```

**Bước 11: Lưu 2 secret vào GitHub.** Vào repo, mở **Settings**, rồi **Secrets and variables**, rồi **Actions**, bấm **New repository secret**:

| Name | Secret |
|---|---|
| `CLOUDFLARE_API_TOKEN_PORTFOLIO` | token vừa copy |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID |

Tên secret phải **trùng từng ký tự** với tên trong `${{ secrets.TÊN }}` ở file workflow; lệch một ký tự là token bị trống. Phải tạo ở tab **Secrets**, không phải tab **Variables**.

**Bước 12: Commit file workflow và push**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: deploy to Cloudflare Pages"
git push
```

**Bước 13: Kiểm tra kết quả**

- Mở tab **Actions** của repo và bấm vào lần chạy trên cùng. Tất cả các bước phải có dấu ✓ xanh, mất khoảng 3 phút.
- Trên Cloudflare, mở **Workers & Pages**, chọn **henry-tran**, xem **Deployments**. Cột Source phải hiện mã commit.

## Phần 4: Dùng hằng ngày

```bash
# sửa nội dung bằng pnpm studio hoặc sửa code
git add -A
git commit -m "Cập nhật dự án VHRM"
git push                          # xong. Khoảng 3 phút sau website tự cập nhật
```

Trong VS Code: mở **Source Control** (Ctrl+Shift+G), nhập mô tả, bấm **Commit**, rồi **Sync Changes**.

Muốn deploy lại mà không sửa gì: mở tab **Actions**, chọn **Deploy**, bấm **Run workflow**.

`pnpm run deploy:cloudflare` vẫn deploy tay được từ máy, nhưng nên chỉ deploy qua push để website luôn khớp với code trên GitHub.

## Khi gặp ✗ đỏ

Khi một lần chạy lỗi, website giữ nguyên bản cũ. Bấm vào lần chạy đó, mở bước bị đỏ và đọc dòng `ERROR`:

| Thông báo lỗi | Nguyên nhân và cách sửa |
|---|---|
| `necessary to set a CLOUDFLARE_API_TOKEN` | Secret thiếu hoặc sai tên: so lại bước 11 |
| `Authentication error [code: 10000]` | Token thiếu quyền *Cloudflare Pages: Edit* hoặc sai tài khoản: tạo lại token |
| `Project not found` | `name` trong `wrangler.toml` không khớp tên project, hoặc sai Account ID |
| Lỗi ở `pnpm install` có chữ *lockfile* | Chạy `pnpm install` ở máy rồi commit file `pnpm-lock.yaml` |
| Lỗi ở `pnpm test`, `lint` hoặc `build` | Lỗi trong code: chạy đúng lệnh đó ở máy để xem và sửa, rồi push lại |

## Ghi chú

- **Bản preview cho nhánh khác `main`:** chưa cấu hình. Nếu cần, thêm nhánh vào `branches:` và đổi `--branch main` thành `--branch ${{ github.ref_name }}`.
- **Token Cloudflare cho phép ghi đè website:** chỉ để token trong GitHub Secrets. Nếu lộ, xoá token ở trang API Tokens rồi tạo token mới, sau đó cập nhật secret.
- **Domain `henry-tran.is-a.dev`:** xem [README › Cloudflare Pages + henry-tran.is-a.dev](../README.md#cloudflare-pages--henry-tranis-adev-đang-dùng).
