"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState, type KeyboardEvent } from "react";

import { useT } from "@/components/i18n-provider";
import type { ProjectDiagram } from "@/lib/content/schema";
import { cn } from "@/lib/utils";
import { InteractiveSystemExplorer } from "./interactive-system-explorer";

export type FeaturedSystem = { slug: string; href: string; name: string; diagram: ProjectDiagram };

/** Tabs switching the System Explorer between featured projects that have a diagram. */
export function FeaturedSystems({ systems }: { systems: FeaturedSystem[] }) {
  const [index, setIndex] = useState(0);
  const t = useT().work;
  const current = systems[Math.min(index, systems.length - 1)];
  const onKeyDown = (e: KeyboardEvent) => {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    const next = (index + delta + systems.length) % systems.length;
    setIndex(next);
    document.getElementById(`system-tab-${systems[next].slug}`)?.focus();
  };
  return (
    <div className="glow-card p-4 sm:p-7">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-brand">{current.diagram.title}</h3>
        </div>
        <div role="tablist" aria-label={t.chooseSystem} className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border-[1.7px] border-brand-raw/50 p-1" onKeyDown={onKeyDown}>
          {systems.map((s, i) => (
            <button
              key={s.slug}
              id={`system-tab-${s.slug}`}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-controls="system-panel"
              tabIndex={i === index ? 0 : -1}
              onClick={() => setIndex(i)}
              className={cn(
                "cursor-pointer rounded-full px-4 py-1.5 text-sm whitespace-nowrap transition-colors",
                i === index ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>
      <div id="system-panel" role="tabpanel" aria-labelledby={`system-tab-${current.slug}`}>
        <InteractiveSystemExplorer key={current.slug} diagram={current.diagram} />
        <Link href={current.href} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline">
          {t.viewCase(current.name)} <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
