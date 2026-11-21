import { MonitorPlay, Star } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { ProjectSummary } from "@/lib/content/derive";
import { t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ProjectVisual } from "./project-visual";

/** Glowing project card: laptop mock-up with the generated illustration, centered title, justified summary. */
export function ProjectCard({
  project: p,
  locale,
  className,
  headingLevel = "h3",
}: {
  project: ProjectSummary;
  locale: Locale;
  className?: string;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  const dict = t(locale).projects;
  return (
    <article className={cn("glow-card glow-card-hover flex min-w-0 flex-col px-6 pt-7 pb-6 opacity-95", className)}>
      <div aria-hidden className="mx-auto w-[90%]">
        <div className="overflow-hidden rounded-t-lg border-[6px] border-b-0 border-[#2d2440] bg-[#120c1f]">
          <ProjectVisual slug={p.slug} caption={p.category} labels={p.labels} className="rounded-none border-0" />
        </div>
        <div className="-mx-[7%] h-2.5 rounded-b-lg bg-[#2d2440]" />
      </div>
      <Heading className="mt-7 text-center text-[1.35rem] font-medium">{p.shortTitle}</Heading>
      <p className="mt-1 text-center text-xs text-muted-foreground">{[p.organization, p.period].filter(Boolean).join(" · ")}</p>
      <p className="mt-4 flex-1 text-justify leading-[1.75] text-foreground/90">{p.summary}</p>
      {p.technologies.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
          {p.technologies.map((tech) => (
            <Badge key={tech} variant="mono">
              {tech}
            </Badge>
          ))}
        </div>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={p.href}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-[#6d20c5d7]"
        >
          <MonitorPlay className="size-4" aria-hidden />
          {dict.caseStudy}
          <span className="sr-only">: {p.title}</span>
        </Link>
        {p.featured && (
          <Badge variant="brand" className="gap-1 px-2.5 py-1">
            <Star className="size-3" aria-hidden /> {dict.featured}
          </Badge>
        )}
        {p.draft && <Badge variant="muted">{dict.draft}</Badge>}
      </div>
    </article>
  );
}
