import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import type { CSSProperties, ReactNode } from "react";

import { Providers } from "@/components/providers";
import { getContent, getSiteUrl } from "@/lib/content";
import { DEFAULT_LOCALE, LOCALE_INFO, localeBootScript } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import "./globals.css";

// One variable monospace family for the whole site (Vietnamese glyphs included).
const mono = JetBrains_Mono({ subsets: ["latin", "latin-ext", "vietnamese"], variable: "--font-mono-family", display: "swap" });

// Pages outside the language layouts (404) still need absolute social image URLs.
export function generateMetadata(): Metadata {
  const url = getSiteUrl(getContent(DEFAULT_LOCALE));
  return url ? { metadataBase: new URL(url) } : {};
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1b1429" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1429" },
  ],
};

// Language-specific metadata, shell and palette live in (en)/layout.tsx and vi/layout.tsx.
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const accent = getContent(DEFAULT_LOCALE).site.accentColor;
  return (
    <html
      lang={LOCALE_INFO[DEFAULT_LOCALE].htmlLang}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      style={{ "--brand": accent } as CSSProperties}
    >
      <head>
        {/* Root layout is server-rendered once and never re-created on client navigation, so this runs only on full loads. */}
        <script dangerouslySetInnerHTML={{ __html: localeBootScript() }} />
      </head>
      <body className={cn(mono.variable, "min-h-dvh font-sans")}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
