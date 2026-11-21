import type { ReactNode } from "react";

import { LocaleLayout, localeMetadata } from "@/components/pages/shared";

export const generateMetadata = () => localeMetadata("vi");

export default function Layout({ children }: { children: ReactNode }) {
  return <LocaleLayout locale="vi">{children}</LocaleLayout>;
}
