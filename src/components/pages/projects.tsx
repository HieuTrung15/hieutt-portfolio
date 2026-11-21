import type { Metadata } from "next";

import { SectionHeading } from "@/components/accent";
import { FeaturedSystems } from "@/components/diagrams/featured-systems";
import { ProjectExplorer } from "@/components/projects/project-explorer";
import { getContent, getProjects, getSummaries } from "@/lib/content";
import { usedCategories } from "@/lib/content/derive";
import { localePath, t, type Locale } from "@/lib/i18n";
import { alternates, siteOgImages } from "./shared";

export function projectsMetadata(locale: Locale): Metadata {
  const c = getContent(locale);
  const description = t(locale).projects.metaDescription(c.profile.name);
  return {
    title: c.site.pageLabels.projects,
    description,
    openGraph: { title: `${c.site.pageLabels.projects} | ${c.profile.name}`, description, images: siteOgImages(locale) },
    alternates: alternates(c, "/projects"),
  };
}

export function ProjectsPage({ locale }: { locale: Locale }) {
  const c = getContent(locale);
  const dict = t(locale);
  const work = c.site.sections.find((s) => s.id === "work");
  const systems = getProjects(locale)
    .filter((p) => p.featured && p.diagram)
    .map((p) => ({ slug: p.slug, href: localePath(locale, `/projects/${p.slug}`), name: p.shortTitle ?? p.title, diagram: p.diagram! }));
  return (
    <div className="mx-auto max-w-[1320px] px-6 py-12 sm:px-10">
      <SectionHeading as="h1" id="projects-title" title={work?.title ?? c.site.pageLabels.projects} description={work?.description ?? dict.projects.intro} />
      <ProjectExplorer projects={getSummaries(locale)} categories={usedCategories(c, getProjects(locale))} />
      {systems.length > 0 && (
        <section aria-labelledby="systems-title" className="mt-24">
          <SectionHeading id="systems-title" title={dict.work.explorer} />
          <FeaturedSystems systems={systems} />
        </section>
      )}
    </div>
  );
}
