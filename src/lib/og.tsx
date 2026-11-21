import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

import { getContent, getProject } from "@/lib/content";
import { t, type Locale } from "@/lib/i18n";

export const OG_SIZE = { width: 1200, height: 630 };

// Latin + Vietnamese subsets (woff: Satori cannot read woff2) so names like "Trần Trung Hiếu" render correctly.
const font = (subset: string, weight: 400 | 600) =>
  fs.readFileSync(path.join(process.cwd(), `node_modules/@fontsource/inter/files/inter-${subset}-${weight}-normal.woff`));

export function ogImage({ eyebrow, title, subtitle, footer, accent }: { eyebrow: string; title: string; subtitle?: string; footer: string; accent: string }) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", padding: 48, background: "linear-gradient(270deg, #1b1429, #140f23)", fontFamily: "Inter" }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 56,
            background: "#170f26",
            boxShadow: "0 4px 18px 4px rgba(119, 53, 136, 0.5)",
            borderRadius: 24,
          }}
        >
          <div style={{ display: "flex", fontSize: 26, color: accent, fontWeight: 600 }}>{eyebrow}</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: title.length > 40 ? 56 : 68, fontWeight: 600, color: "#ffffff", lineHeight: 1.1, letterSpacing: -1.5 }}>
              {title}
            </div>
            {subtitle && <div style={{ display: "flex", marginTop: 24, fontSize: 28, color: "#b9a9cf", lineHeight: 1.4 }}>{subtitle}</div>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 24, color: "#b9a9cf" }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, background: accent }} />
            {footer}
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Inter", data: font("latin", 400), weight: 400 },
        { name: "Inter", data: font("latin", 600), weight: 600 },
        { name: "Inter", data: font("vietnamese", 400), weight: 400 },
        { name: "Inter", data: font("vietnamese", 600), weight: 600 },
      ],
    },
  );
}

// ---- Route helpers (one image per page and language) ----

export function siteOgImage(locale: Locale) {
  const c = getContent(locale);
  return ogImage({ eyebrow: c.profile.title, title: c.profile.name, subtitle: c.profile.statement, footer: c.profile.tagline, accent: c.site.accentColor });
}

export function projectOgImage(locale: Locale, slug: string) {
  const c = getContent(locale);
  const p = getProject(locale, slug)!;
  return ogImage({
    eyebrow: [t(locale).og.caseStudy, p.category].filter(Boolean).join(" · "),
    title: p.title,
    subtitle: p.summary,
    footer: `${c.profile.name} — ${c.profile.title}`,
    accent: c.site.accentColor,
  });
}
