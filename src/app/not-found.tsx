import { NotFoundContent } from "@/components/pages/not-found";
import { LocaleLayout } from "@/components/pages/shared";

export const metadata = { title: "Page not found · Không tìm thấy trang" };

// Static hosts serve one 404.html for every language, so it shows both.
export default function NotFound() {
  return (
    <LocaleLayout locale="en">
      <NotFoundContent locale="en" />
      <div lang="vi" className="-mt-16 border-t pb-10">
        <NotFoundContent locale="vi" secondary />
      </div>
    </LocaleLayout>
  );
}
