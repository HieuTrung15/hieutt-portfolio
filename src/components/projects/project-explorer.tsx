"use client";

import { RotateCcw, Search } from "lucide-react";
import { useState } from "react";

import type { ProjectSummary } from "@/lib/content/derive";
import { useLocale, useT } from "@/components/i18n-provider";
import { matches } from "@/lib/search";
import { cn } from "@/lib/utils";
import { ProjectCard } from "./project-card";

/** Filters and search are derived from project data; adding a project file updates this page automatically. */
export function ProjectExplorer({ projects, categories }: { projects: ProjectSummary[]; categories: { id: string; label: string }[] }) {
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const locale = useLocale();
  const t = useT().projects;
  const label = new Map(categories.map((x) => [x.id, x.label]));

  const visible = projects.filter(
    (p) =>
      (!category || p.categories.includes(category)) &&
      matches(query, [p.title, p.shortTitle, p.organization, p.category, p.summary, ...p.technologies, ...p.categories.map((id) => label.get(id))]),
  );
  const reset = () => {
    setCategory(null);
    setQuery("");
  };
  const chips = [{ id: null, label: t.all, count: projects.length }, ...categories.map((x) => ({ ...x, count: projects.filter((p) => p.categories.includes(x.id)).length }))];

  return (
    <div>
      <div className="flex flex-col items-center gap-6">
        <div role="group" aria-label={t.filterAria} className="flex flex-wrap justify-center gap-3">
          {chips.map((chip) => {
            const on = category === chip.id;
            return (
              <button
                key={chip.id ?? "all"}
                type="button"
                aria-pressed={on}
                onClick={() => setCategory(chip.id)}
                className={cn(
                  "tech-pill inline-flex min-h-10 cursor-pointer items-center gap-2 px-4 text-[0.95rem]",
                  on ? "bg-brand-raw/30 outline-2 outline-brand-raw" : "bg-transparent",
                )}
              >
                {chip.label}
                <span className="font-mono text-[11px] text-muted-foreground">{chip.count}</span>
              </button>
            );
          })}
        </div>
        <label className="relative block w-full max-w-md">
          <span className="sr-only">{t.searchLabel}</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="h-11 w-full rounded-full border-[1.7px] border-brand-raw/60 bg-card pr-4 pl-10 text-sm outline-none placeholder:text-faint focus-visible:border-brand-raw focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-raw/25"
          />
        </label>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground" aria-live="polite">
        {t.count(visible.length, projects.length)}
      </p>

      {visible.length > 0 ? (
        <div className="mt-8 grid gap-10 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => (
            <ProjectCard key={p.slug} project={p} locale={locale} headingLevel="h2" />
          ))}
        </div>
      ) : (
        <div className="glow-card mx-auto mt-8 flex max-w-lg flex-col items-center gap-3 p-8 text-center">
          <p className="font-medium">{t.emptyTitle}</p>
          <p className="text-sm text-muted-foreground">{t.emptyText}</p>
          <button type="button" onClick={reset} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm hover:bg-accent">
            <RotateCcw className="size-3.5" aria-hidden /> {t.clear}
          </button>
        </div>
      )}
    </div>
  );
}
