import {
  ArrowRightLeft,
  BadgeCheck,
  BadgeDollarSign,
  Bot,
  Boxes,
  Braces,
  Building2,
  Calculator,
  ClipboardList,
  Code,
  Database,
  Factory,
  FileChartColumn,
  FileCog,
  GraduationCap,
  Handshake,
  Headset,
  LayoutDashboard,
  ListChecks,
  Monitor,
  PanelsTopLeft,
  Plug,
  Printer,
  Rocket,
  Server,
  ServerCog,
  ShoppingCart,
  Sparkles,
  Truck,
  Users,
  Warehouse,
  Workflow,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";
import {
  siCss,
  siErpnext,
  siFrappe,
  siHtml5,
  siJavascript,
  siJinja,
  siMariadb,
  siMysql,
  siOdoo,
  siPostgresql,
  siPython,
  siReact,
  type SimpleIcon,
} from "simple-icons";

import { luminance, type SkillIconKey } from "@/lib/skill-icons";
import { cn } from "@/lib/utils";

const ICONS: Record<SkillIconKey, SimpleIcon | LucideIcon> = {
  erpnext: siErpnext,
  frappe: siFrappe,
  odoo: siOdoo,
  python: siPython,
  mysql: siMysql,
  mariadb: siMariadb,
  postgresql: siPostgresql,
  javascript: siJavascript,
  react: siReact,
  html5: siHtml5,
  css: siCss,
  jinja: siJinja,
  "file-cog": FileCog,
  workflow: Workflow,
  boxes: Boxes,
  printer: Printer,
  "file-chart": FileChartColumn,
  plug: Plug,
  database: Database,
  braces: Braces,
  bot: Bot,
  "panels-top-left": PanelsTopLeft,
  "layout-dashboard": LayoutDashboard,
  factory: Factory,
  calculator: Calculator,
  warehouse: Warehouse,
  "shopping-cart": ShoppingCart,
  "badge-dollar-sign": BadgeDollarSign,
  truck: Truck,
  handshake: Handshake,
  users: Users,
  "badge-check": BadgeCheck,
  "clipboard-list": ClipboardList,
  "list-checks": ListChecks,
  rocket: Rocket,
  "arrow-right-left": ArrowRightLeft,
  "graduation-cap": GraduationCap,
  "server-cog": ServerCog,
  wrench: Wrench,
  headset: Headset,
  server: Server,
  monitor: Monitor,
  building: Building2,
  code: Code,
  sparkles: Sparkles,
};

const WORDMARKS = new Set<SkillIconKey>(["odoo", "mysql"]);

/**
 * Brand logo in its own colour, or a lucide icon in the accent colour.
 * Very dark brand colours are lightened on the dark theme and very light ones darkened on the light theme,
 * so logos such as MariaDB or JavaScript never disappear into the background.
 */
export function SkillIcon({ name, className = "size-[18px]" }: { name: SkillIconKey; className?: string }) {
  const icon = ICONS[name];
  if (!("path" in icon)) {
    const Icon = icon;
    return <Icon className={cn(className, "text-brand")} aria-hidden />;
  }
  const l = luminance(icon.hex);
  // Wordmark logos are wide and short inside the square viewBox; draw them bigger without growing the pill.
  const wordmark = WORDMARKS.has(name) && "-my-[7px] size-8";
  const tone =
    l < 0.1
      ? "text-[var(--icon)] dark:text-[color-mix(in_oklab,var(--icon)_45%,white)]"
      : l > 0.5
        ? "text-[color-mix(in_oklab,var(--icon)_65%,black)] dark:text-[var(--icon)]"
        : "text-[var(--icon)]";
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={cn(className, wordmark, tone)} style={{ "--icon": `#${icon.hex}` } as CSSProperties}>
      <path d={icon.path} />
    </svg>
  );
}
