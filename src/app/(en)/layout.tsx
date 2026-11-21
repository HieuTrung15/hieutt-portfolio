import type { ReactNode } from "react";

import { LocaleLayout, localeMetadata } from "@/components/pages/shared";

export const generateMetadata = () => localeMetadata("en");

export default function Layout({ children }: { children: ReactNode }) {
  return <LocaleLayout locale="en">{children}</LocaleLayout>;
}
