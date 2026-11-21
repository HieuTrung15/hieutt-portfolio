// Icon keys a skill can use (content/skills.json › icon). No imports: shared by the schema, the Studio and the site.
export const SKILL_ICONS = [
  // Brand logos (simple-icons)
  "erpnext",
  "frappe",
  "odoo",
  "python",
  "mysql",
  "mariadb",
  "postgresql",
  "javascript",
  "react",
  "html5",
  "css",
  "jinja",
  // Generic icons (lucide)
  "file-cog",
  "workflow",
  "boxes",
  "printer",
  "file-chart",
  "plug",
  "database",
  "braces",
  "bot",
  "panels-top-left",
  "layout-dashboard",
  "factory",
  "calculator",
  "warehouse",
  "shopping-cart",
  "badge-dollar-sign",
  "truck",
  "handshake",
  "users",
  "badge-check",
  "clipboard-list",
  "list-checks",
  "rocket",
  "arrow-right-left",
  "graduation-cap",
  "server-cog",
  "wrench",
  "headset",
  "server",
  "monitor",
  "building",
  "code",
  "sparkles",
] as const;

export type SkillIconKey = (typeof SKILL_ICONS)[number];

/** WCAG relative luminance (0 = black, 1 = white) of a 6-digit hex colour without "#". */
export function luminance(hex: string) {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
