import { ArrowLeft, ArrowRight, Briefcase, ChevronRight, Info, LifeBuoy, Users, Wrench, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { InteractiveSystemExplorer } from "@/components/diagrams/interactive-system-explorer";
import { CopyButton } from "@/components/layout/copy-button";
import { MarkdownContent } from "@/components/markdown";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectVisual } from "@/components/projects/project-visual";
import { Badge } from "@/components/ui/badge";
import { getContent, getProject, getProjects } from "@/lib/content";
import { isPendingDetail, projectPeriod, relatedProjects, toSummary, visualLabels } from "@/lib/content/derive";
import type { ResponsibilityType } from "@/lib/content/schema";
import { DEFAULT_LOCALE, localePath, t, type Locale } from "@/lib/i18n";
import { alternates } from "./shared";

// Published slugs are the same in every language.
export const projectParams = () => getProjects(DEFAULT_LOCALE).map((p) => ({ slug: p.slug }));

export function projectMetadata(locale: Locale, slug: string): Metadata {
  const p = getProject(locale, slug);
  if (!p) return {};
  const c = getContent(locale);
  const description = p.overview || p.summary;
  return {
    title: p.title,
    description,
    openGraph: { type: "article", title: `${p.title} | ${c.profile.name}`, description },
    twitter: { title: p.title, description },
    alternates: alternates(c, `/projects/${p.slug}`),
  };
}

const ICONS: Record<ResponsibilityType, LucideIcon> = { development: Wrench, team: Users, management: Briefcase, operations: LifeBuoy };

function CaseSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 border-t pt-10 lg:scroll-mt-8">
      <h2 id={`${id}-title`} className="text-[1.5rem] font-medium text-brand">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function ProjectPage({ locale, slug }: { locale: Locale; slug: string }) {
  const p = getProject(locale, slug);
  if (!p) notFound();
  const c = getContent(locale);
  const dict = t(locale).caseStudy;
  const projects = getProjects(locale);
  const index = projects.findIndex((x) => x.slug === p.slug);
  const prev = projects[index - 1];
  const next = projects[index + 1];
  const period = projectPeriod(p, c);
  const caseStudy = c.caseStudies[p.slug]?.trim();
  const skillNames = new Map(c.skills.skills.map((s) => [s.id, s.name]));
  const related = relatedProjects(p, projects).map((r) => toSummary(r, c));
  const groups = (Object.keys(ICONS) as ResponsibilityType[])
    .map((type) => ({ type, items: p.responsibilities.filter((r) => r.type === type) }))
    .filter((g) => g.items.length > 0);

  const toc = [
    caseStudy && { id: "context", label: dict.context },
    groups.length > 0 && { id: "responsibilities", label: dict.responsibilities },
    p.modules.length > 0 && { id: "modules", label: dict.modules },
    (p.technologies.length > 0 || p.skillIds.length > 0) && { id: "stack", label: dict.stackShort },
    p.diagram && { id: "system", label: dict.system },
    p.contributions.length > 0 && { id: "results", label: dict.results },
    p.gallery.length > 0 && { id: "gallery", label: dict.gallery },
  ].filter((x): x is { id: string; label: string } => !!x);

  const meta = [
    { label: dict.organization, value: p.organization },
    { label: dict.industry, value: p.industry },
    { label: dict.role, value: p.role },
    { label: period?.isContext ? dict.contextPeriod : dict.period, value: period?.label },
  ].filter((m) => m.value);

  return (
    <article className="mx-auto max-w-[1180px] px-6 py-10 sm:px-10 md:py-14">
      <nav aria-label="Breadcrumb" className="mb-8">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <Link href={localePath(locale, "/")} className="hover:text-foreground">
              {dict.home}
            </Link>
            <ChevronRight className="size-3.5 text-faint" aria-hidden />
          </li>
          <li className="flex items-center gap-1.5">
            <Link href={localePath(locale, "/projects")} className="hover:text-foreground">
              {dict.projects}
            </Link>
            <ChevronRight className="size-3.5 text-faint" aria-hidden />
          </li>
          <li aria-current="page" className="text-foreground">
            {p.shortTitle ?? p.title}
          </li>
        </ol>
      </nav>

      <header>
        <div className="flex flex-wrap items-center gap-2">
          {p.category && <Badge variant="brand">{p.category}</Badge>}
          {p.status === "draft" && <Badge variant="muted">{dict.draft}</Badge>}
        </div>
        <h1 className="mt-4 max-w-4xl text-3xl leading-tight font-semibold text-balance sm:text-[2.5rem]">{p.title}</h1>
        {(p.overview || p.summary) && (
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-pretty text-muted-foreground">{p.overview || p.summary}</p>
        )}

        <dl className="mt-8 flex flex-wrap gap-px overflow-hidden rounded-xl border bg-border">
          {meta.map((m) => (
            <div key={m.label} className="min-w-[10rem] flex-1 bg-background p-4">
              <dt className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">{m.label}</dt>
              <dd className="mt-1 text-sm font-medium">{m.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {p.technologies.map((tech) => (
              <Badge key={tech} variant="mono">
                {tech}
              </Badge>
            ))}
          </div>
          <CopyButton label={dict.copyLink} copiedLabel={dict.linkCopied} className="px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground" />
        </div>
      </header>

      <div className="mt-8">
        {p.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- static export, unoptimized images
          <img src={p.coverImage} alt={p.coverAlt || p.title} className="w-full rounded-xl border object-cover" />
        ) : (
          <ProjectVisual slug={p.slug} caption={p.category} labels={visualLabels(p).length ? visualLabels(p) : p.technologies} diagram={p.diagram} size="hero" />
        )}
      </div>

      <div className="mt-12 gap-12 xl:grid xl:grid-cols-[minmax(0,1fr)_200px]">
        <div className="min-w-0 space-y-12">
          {isPendingDetail(p, c) && (
            <div className="flex gap-3 rounded-xl border border-dashed bg-background-alt p-5 text-sm">
              <Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
              <p className="leading-relaxed text-muted-foreground">{dict.pending}</p>
            </div>
          )}

          {caseStudy && (
            <CaseSection id="context" title={dict.context}>
              <div className="max-w-3xl">
                <MarkdownContent>{caseStudy}</MarkdownContent>
              </div>
            </CaseSection>
          )}

          {groups.length > 0 && (
            <CaseSection id="responsibilities" title={dict.responsibilities}>
              <div className="grid gap-4 md:grid-cols-2">
                {groups.map(({ type, items }) => {
                  const Icon = ICONS[type];
                  return (
                    <div key={type} className="rounded-xl border bg-card p-5">
                      <h3 className="flex items-center gap-2 text-sm font-semibold">
                        <Icon className="size-4 text-brand" aria-hidden /> {dict.types[type]}
                      </h3>
                      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
                        {items.map((r) => (
                          <li key={r.text} className="flex gap-2.5">
                            <span className="mt-2 size-1 shrink-0 rounded-full bg-faint" aria-hidden />
                            {r.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </CaseSection>
          )}

          {p.modules.length > 0 && (
            <CaseSection id="modules" title={dict.modules}>
              <div className="grid gap-4 md:grid-cols-2">
                {p.modules.map((m) => (
                  <div key={m.name} className="rounded-xl border bg-card p-5">
                    <h3 className="font-semibold tracking-tight">{m.name}</h3>
                    {m.description && <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>}
                    {m.items.length > 0 && (
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {m.items.map((item) => (
                          <li key={item}>
                            <Badge variant="muted" className="text-[12px] font-normal whitespace-normal">
                              {item}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </CaseSection>
          )}

          {(p.technologies.length > 0 || p.skillIds.length > 0) && (
            <CaseSection id="stack" title={dict.stack}>
              {p.technologies.length > 0 && (
                <div>
                  <h3 className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">{dict.techStack}</h3>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {p.technologies.map((tech) => (
                      <li key={tech} className="rounded-lg border bg-card px-3 py-1.5 font-mono text-sm">
                        {tech}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {p.skillIds.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">{dict.relatedSkills}</h3>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {p.skillIds.map((id) => (
                      <li key={id}>
                        <Link
                          href={localePath(locale, `/about#skill-${id}`)}
                          className="inline-flex min-h-8 items-center rounded-md border bg-background px-2.5 text-[13px] hover:border-brand/50 hover:text-brand"
                        >
                          {skillNames.get(id)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CaseSection>
          )}

          {p.diagram && (
            <CaseSection id="system" title={p.diagram.title || dict.system}>
              <InteractiveSystemExplorer diagram={p.diagram} />
            </CaseSection>
          )}

          {p.contributions.length > 0 && (
            <CaseSection id="results" title={dict.results}>
              <dl className="divide-y rounded-xl border bg-card">
                {p.contributions.map((r) => (
                  <div key={r.label} className="grid gap-1 p-4 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-6">
                    <dt className="text-sm font-medium">{r.label}</dt>
                    <dd className="text-sm leading-relaxed text-muted-foreground">{r.value}</dd>
                  </div>
                ))}
              </dl>
            </CaseSection>
          )}

          {p.gallery.length > 0 && (
            <CaseSection id="gallery" title={dict.gallery}>
              <div className="grid gap-4 sm:grid-cols-2">
                {p.gallery.map((img) => (
                  <figure key={img.src} className="overflow-hidden rounded-xl border bg-card">
                    {/* eslint-disable-next-line @next/next/no-img-element -- static export */}
                    <img src={img.src} alt={img.alt} loading="lazy" className="w-full" />
                    {img.caption && <figcaption className="border-t p-3 text-xs text-muted-foreground">{img.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            </CaseSection>
          )}
        </div>

        {toc.length > 1 && (
          <nav aria-label={dict.tocAria} className="hidden xl:block">
            <div className="sticky top-8">
              <p className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">{dict.onThisPage}</p>
              <ul className="mt-3 space-y-1.5 border-l text-sm">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} className="-ml-px block border-l border-transparent pl-3 text-muted-foreground hover:border-foreground hover:text-foreground">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        )}
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-16 border-t pt-10">
          <h2 id="related-title" className="text-xl font-semibold tracking-tight">
            {dict.related}
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {related.map((r) => (
              <ProjectCard key={r.slug} project={r} locale={locale} />
            ))}
          </div>
        </section>
      )}

      <nav aria-label={dict.navAria} className="mt-12 grid gap-3 border-t pt-8 sm:grid-cols-3">
        {prev ? (
          <Link href={localePath(locale, `/projects/${prev.slug}`)} className="group rounded-xl border p-4 hover:border-foreground/20">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowLeft className="size-3.5" aria-hidden /> {dict.previous}
            </span>
            <span className="mt-1 block truncate text-sm font-medium group-hover:text-brand">{prev.shortTitle ?? prev.title}</span>
          </Link>
        ) : (
          <span className="hidden sm:block" />
        )}
        <Link href={localePath(locale, "/projects")} className="flex items-center justify-center rounded-xl border p-4 text-sm font-medium hover:border-foreground/20">
          {dict.allProjects}
        </Link>
        {next ? (
          <Link href={localePath(locale, `/projects/${next.slug}`)} className="group rounded-xl border p-4 text-right hover:border-foreground/20">
            <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
              {dict.next} <ArrowRight className="size-3.5" aria-hidden />
            </span>
            <span className="mt-1 block truncate text-sm font-medium group-hover:text-brand">{next.shortTitle ?? next.title}</span>
          </Link>
        ) : (
          <span className="hidden sm:block" />
        )}
      </nav>
    </article>
  );
}
