"use client";

import {
  Calculator,
  ChartColumn,
  CircleDot,
  ClipboardList,
  Database,
  Factory,
  FileText,
  Handshake,
  LayoutDashboard,
  Plug,
  Server,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Store,
  Truck,
  Users,
  Warehouse,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { useState, type PointerEvent } from "react";

import { useT } from "@/components/i18n-provider";
import { Badge } from "@/components/ui/badge";
import type { DiagramIcon, ProjectDiagram } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

const ICONS: Record<DiagramIcon, LucideIcon> = {
  circle: CircleDot,
  users: Users,
  "file-text": FileText,
  dashboard: LayoutDashboard,
  plug: Plug,
  smartphone: Smartphone,
  cart: ShoppingCart,
  factory: Factory,
  clipboard: ClipboardList,
  warehouse: Warehouse,
  truck: Truck,
  chart: ChartColumn,
  shield: ShieldCheck,
  handshake: Handshake,
  calculator: Calculator,
  store: Store,
  server: Server,
  database: Database,
  workflow: Workflow,
  settings: Settings,
};

export const DIAGRAM_NOTE = {
  conceptual: "Conceptual workflow based on documented project scope.",
  documented: "Documented architecture.",
} as const;

/**
 * Interactive diagram driven entirely by `diagram` content (content/projects/*.json).
 * Desktop: positioned nodes + SVG connectors. Mobile: node list. Both share one detail panel,
 * so nothing important depends on hover.
 */
export function InteractiveSystemExplorer({ diagram, className }: { diagram: ProjectDiagram; className?: string }) {
  const [selected, setSelected] = useState(diagram.nodes[0].id);
  const t = useT().explorer;
  const [hovered, setHovered] = useState<string | null>(null);
  const byId = new Map(diagram.nodes.map((n) => [n.id, n]));
  // A stale id (content edited while open) falls back to the first node.
  const activeId = byId.has(hovered ?? selected) ? (hovered ?? selected) : diagram.nodes[0].id;
  const active = byId.get(activeId)!;

  const touches = (e: ProjectDiagram["edges"][number]) => e.from === activeId || e.to === activeId;
  const neighbors = new Set(diagram.edges.filter(touches).flatMap((e) => [e.from, e.to]));
  const connections = diagram.edges.filter(touches).map((e) => ({
    other: byId.get(e.from === activeId ? e.to : e.from)!,
    outgoing: e.from === activeId,
    label: e.label,
  }));

  const nodeHandlers = (id: string) => ({
    onClick: () => setSelected(id),
    onPointerEnter: (e: PointerEvent) => e.pointerType === "mouse" && setHovered(id),
    onPointerLeave: () => setHovered(null),
    onFocus: () => setHovered(id),
    onBlur: () => setHovered(null),
    "aria-pressed": selected === id,
  });

  const state = (id: string) => (id === activeId ? "active" : neighbors.has(id) ? "neighbor" : "idle");

  return (
    <figure className={cn("@container space-y-3", className)}>
      <div className="grid gap-4 @4xl:grid-cols-[minmax(0,1fr)_280px]">
        {/* Desktop canvas */}
        <div
          role="group"
          aria-label={`${t.diagram}: ${diagram.title ?? t.system}`}
          className="relative hidden aspect-[2/1] overflow-hidden rounded-xl border bg-background-alt @xl:block"
        >
          <div className="dot-grid absolute inset-0 opacity-60" aria-hidden />
          <div className="absolute inset-x-[7%] inset-y-[11%]">
            <svg className="absolute inset-0 size-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              {diagram.edges.map((e) => {
                const a = byId.get(e.from)!;
                const b = byId.get(e.to)!;
                const on = touches(e);
                return (
                  <line
                    key={`${e.from}-${e.to}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    vectorEffect="non-scaling-stroke"
                    strokeWidth={on ? 1.75 : 1}
                    strokeDasharray={on ? undefined : "4 4"}
                    className={cn("transition-[stroke] duration-200", on ? "stroke-brand" : "stroke-foreground/20")}
                  />
                );
              })}
            </svg>
            {diagram.edges.filter((e) => touches(e) && e.label).map((e) => {
              const a = byId.get(e.from)!;
              const b = byId.get(e.to)!;
              return (
                <span
                  key={`label-${e.from}-${e.to}`}
                  aria-hidden
                  className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded border border-brand/30 bg-background px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap text-brand animate-in fade-in"
                  style={{ left: `${(a.x + b.x) / 2}%`, top: `${(a.y + b.y) / 2}%` }}
                >
                  {e.label}
                </span>
              );
            })}
            {diagram.nodes.map((n) => {
              const Icon = ICONS[n.icon];
              const s = state(n.id);
              return (
                <button
                  key={n.id}
                  type="button"
                  {...nodeHandlers(n.id)}
                  style={{ left: `${n.x}%`, top: `${n.y}%` }}
                  className={cn(
                    "absolute z-20 flex max-w-[8.5rem] -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center gap-2 rounded-lg border bg-background py-1.5 pr-2.5 pl-1.5 text-left text-xs leading-tight font-medium shadow-xs transition-all duration-200",
                    s === "active" && "border-brand text-foreground shadow-md ring-4 ring-brand/10",
                    s === "neighbor" && "border-brand/40 text-foreground",
                    s === "idle" && "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className={cn("inline-flex size-6 shrink-0 items-center justify-center rounded-md transition-colors", s === "active" ? "bg-brand text-white" : "bg-muted text-muted-foreground")}>
                    <Icon className="size-3.5" aria-hidden />
                  </span>
                  {n.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile list */}
        <div role="group" aria-label={`${t.components}: ${diagram.title ?? t.system}`} className="grid grid-cols-2 gap-2 @xl:hidden">
          {diagram.nodes.map((n) => {
            const Icon = ICONS[n.icon];
            const s = state(n.id);
            return (
              <button
                key={n.id}
                type="button"
                {...nodeHandlers(n.id)}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border bg-background px-2.5 py-2 text-left text-xs font-medium transition-colors",
                  s === "active" && "border-brand bg-brand-soft text-foreground",
                  s === "neighbor" && "border-brand/40",
                  s === "idle" && "text-muted-foreground",
                )}
              >
                <Icon className={cn("size-4 shrink-0", s === "active" ? "text-brand" : "text-faint")} aria-hidden />
                {n.label}
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        <div aria-live="polite" className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2.5">
            {(() => {
              const Icon = ICONS[active.icon];
              return (
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <Icon className="size-4" aria-hidden />
                </span>
              );
            })()}
            <p className="font-semibold tracking-tight">{active.label}</p>
          </div>
          {active.description && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{active.description}</p>}
          {active.responsibilities.length > 0 && (
            <div className="mt-4">
              <p className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">{t.responsibilities}</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {active.responsibilities.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-brand" aria-hidden />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {active.technologies.length > 0 && (
            <div className="mt-4">
              <p className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">{t.technologies}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {active.technologies.map((t) => (
                  <Badge key={t} variant="mono">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {connections.length > 0 && (
            <div className="mt-4">
              <p className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">{t.connections}</p>
              <ul className="mt-2 space-y-1">
                {connections.map(({ other, outgoing, label }) => (
                  <li key={other.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(other.id)}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm hover:bg-accent"
                    >
                      <span className="font-mono text-xs text-brand" aria-label={outgoing ? t.to : t.from}>
                        {outgoing ? "→" : "←"}
                      </span>
                      <span>{other.label}</span>
                      {label && <span className="ml-auto truncate font-mono text-[11px] text-muted-foreground">{label}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <Badge variant={diagram.kind === "documented" ? "brand" : "muted"}>{diagram.kind === "documented" ? "Documented" : "Conceptual"}</Badge>
        <span>{DIAGRAM_NOTE[diagram.kind]}</span>
        <span className="hidden @xl:inline">· {t.hintPointer}</span>
        <span className="@xl:hidden">· {t.hintTouch}</span>
      </figcaption>
    </figure>
  );
}
