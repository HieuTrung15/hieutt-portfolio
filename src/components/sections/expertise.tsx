import { SectionHeading } from "@/components/accent";
import { SkillIcon } from "@/components/skill-icon";
import { getSummaries } from "@/lib/content";
import type { Content } from "@/lib/content/schema";
import type { SkillIconKey } from "@/lib/skill-icons";
import { SkillExplorer, type SkillGroupView, type SkillProjectView } from "./skill-explorer";

// Used when a skill has no icon of its own; any other group falls back to "sparkles".
const GROUP_ICON: Record<string, SkillIconKey> = {
  "erp-development": "boxes",
  "backend-integration": "server",
  frontend: "monitor",
  "business-domains": "building",
  "system-delivery": "rocket",
};

export function Expertise({ c, section }: { c: Content; section: Content["site"]["sections"][number] }) {
  const summaries = getSummaries(c.locale);
  const projects: Record<string, SkillProjectView> = Object.fromEntries(
    summaries.map((p) => [p.slug, { slug: p.slug, href: p.href, name: p.shortTitle, meta: [p.organization, p.period].filter(Boolean).join(" · ") }]),
  );
  const groups: SkillGroupView[] = c.skills.groups
    .map((g) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      skills: c.skills.skills
        .filter((s) => s.group === g.id && s.visible)
        .map((s) => ({
          id: s.id,
          name: s.name,
          // Rendered here (server) so the logo SVGs never enter the client bundle.
          icon: <SkillIcon name={s.icon ?? GROUP_ICON[g.id] ?? "sparkles"} />,
          projects: summaries.filter((p) => p.skillIds.includes(s.id)).map((p) => p.slug),
        })),
    }))
    .filter((g) => g.skills.length > 0);

  return (
    <section id="expertise" data-section aria-labelledby="expertise-title" className="py-14">
      <SectionHeading id="expertise-title" title={section.title ?? section.label} description={section.description} />
      <SkillExplorer groups={groups} projects={projects} />
    </section>
  );
}
