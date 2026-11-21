"use client";

import { ArrowUpRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useState, type ReactNode } from "react";

import { useT } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

export type SkillGroupView = {
  id: string;
  title: string;
  description?: string;
  skills: { id: string; name: string; icon: ReactNode; projects: string[] }[];
};
export type SkillProjectView = { slug: string; href: string; name: string; meta: string };

/** Skill pills grouped by capability; selecting one lists its projects. `#skill-<id>` preselects (command palette). */
export function SkillExplorer({ groups, projects }: { groups: SkillGroupView[]; projects: Record<string, SkillProjectView> }) {
  const [selected, setSelected] = useState<string | null>(null);
  const t = useT();
  const skill = groups.flatMap((g) => g.skills).find((s) => s.id === selected) ?? null;

  useEffect(() => {
    const ids = new Set(groups.flatMap((g) => g.skills.map((s) => s.id)));
    const fromHash = () => {
      const id = window.location.hash.match(/^#skill-(.+)$/)?.[1];
      if (!id || !ids.has(id)) return;
      setSelected(id);
      document.getElementById("expertise")?.scrollIntoView();
    };
    // Deferred so the initial hash is applied after hydration, not during the effect pass.
    const timer = setTimeout(fromHash, 0);
    window.addEventListener("hashchange", fromHash);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("hashchange", fromHash);
    };
  }, [groups]);

  return (
    <div className="space-y-12">
      {groups.map((g) => {
        return (
          <Fragment key={g.id}>
            <div>
              <h3 className="text-center text-lg font-semibold text-brand">{g.title}</h3>
              {g.description && <p className="mt-1 text-center text-sm text-muted-foreground">{g.description}</p>}
              <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-5">
                {g.skills.map((s) => {
                  const on = s.id === selected;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => setSelected((cur) => (cur === s.id ? null : s.id))}
                        className={cn(
                          "tech-pill inline-flex min-h-11 cursor-pointer items-center gap-2.5 px-5 py-2 text-[0.95rem]",
                          on ? "bg-brand-raw/30 outline-2 outline-brand-raw" : "bg-transparent",
                        )}
                      >
                        {s.icon}
                        {s.name}
                        {s.projects.length > 0 && (
                          <span className="font-mono text-[11px] text-muted-foreground" aria-label={t.common.projectsCount(s.projects.length)}>
                            {s.projects.length}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            {skill && g.skills.some((s) => s.id === skill.id) && (
              <Results skill={skill} projects={projects} onReset={() => setSelected(null)} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

function Results({
  skill,
  projects,
  onReset,
}: {
  skill: SkillGroupView["skills"][number];
  projects: Record<string, SkillProjectView>;
  onReset: () => void;
}) {
  const t = useT();
  const list = skill.projects.map((slug) => projects[slug]).filter(Boolean);
  return (
    <div className="glow-card mx-auto max-w-3xl p-6" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-wider text-muted-foreground uppercase">{t.skills.usedIn}</p>
          <p className="mt-1 text-lg font-semibold text-brand">{skill.name}</p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <RotateCcw className="size-3.5" aria-hidden /> {t.skills.reset}
        </button>
      </div>
      {list.length > 0 ? (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {list.map((p) => (
            <li key={p.slug}>
              <Link href={p.href} className="group flex items-center gap-3 rounded-md border px-3 py-2.5 hover:border-brand-raw">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{p.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{p.meta}</span>
                </span>
                <ArrowUpRight className="size-4 text-faint group-hover:text-brand" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">{t.skills.empty}</p>
      )}
    </div>
  );
}
