import type { ProjectDiagram } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

/**
 * Generated illustration built only from the project's own data (diagram nodes / module names).
 * Used when no approved screenshot exists, so no real system UI is shown or imitated.
 */
export function ProjectVisual({
  slug,
  caption,
  labels,
  size = "card",
  diagram,
  className,
}: {
  /** Hero only: draws a static preview of the project's diagram instead of label chips. */
  diagram?: ProjectDiagram;
  slug: string;
  caption?: string;
  labels: string[];
  size?: "card" | "hero";
  className?: string;
}) {
  const hero = size === "hero";
  return (
    <div aria-hidden className={cn("relative overflow-hidden rounded-lg border bg-background-alt", className)}>
      <div className="flex items-center gap-1.5 border-b bg-background px-3 py-2">
        <span className="size-2 rounded-full bg-border" />
        <span className="size-2 rounded-full bg-border" />
        <span className="size-2 rounded-full bg-border" />
        <span className="ml-2 min-w-0 truncate font-mono text-[10px] text-muted-foreground">
          erp://{slug}
          {caption ? ` · ${caption}` : ""}
        </span>
      </div>
      {hero && diagram ? (
        <div className="dot-grid relative aspect-[2/1] sm:aspect-[3/1]">
          <div className="absolute inset-x-[8%] inset-y-[14%]">
            <svg className="absolute inset-0 size-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
              {diagram.edges.map((e) => {
                const a = diagram.nodes.find((n) => n.id === e.from)!;
                const b = diagram.nodes.find((n) => n.id === e.to)!;
                return <line key={`${e.from}-${e.to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} vectorEffect="non-scaling-stroke" strokeWidth={1} className="stroke-foreground/20" />;
              })}
            </svg>
            {diagram.nodes.map((n, i) => (
              <span
                key={n.id}
                style={{ left: `${n.x}%`, top: `${n.y}%` }}
                className={cn(
                  "absolute max-w-[7rem] -translate-x-1/2 -translate-y-1/2 truncate rounded-md border bg-background px-2 py-1 font-mono text-[10px] shadow-xs sm:max-w-[9rem] sm:text-xs",
                  i === 0 ? "border-brand/40 text-brand" : "text-muted-foreground",
                )}
              >
                {n.label}
              </span>
            ))}
          </div>
        </div>
      ) : (
      <div className={cn("dot-grid flex flex-wrap content-start gap-2", hero ? "min-h-56 p-6 sm:p-8" : "h-32 overflow-hidden p-4 [mask-image:linear-gradient(to_bottom,black_65%,transparent)]")}>
        {labels.length > 0 ? (
          labels.map((label, i) => (
            <span
              key={label}
              className={cn(
                "rounded-md border bg-background px-2.5 py-1 font-mono shadow-xs",
                hero ? "text-xs sm:text-sm" : "text-[11px]",
                i === 0 ? "border-brand/40 text-brand" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
          ))
        ) : (
          <span className="rounded-md border border-dashed bg-background px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
            content pending
          </span>
        )}
      </div>
      )}
    </div>
  );
}
