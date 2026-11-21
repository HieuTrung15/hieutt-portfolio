import { GraduationCap } from "lucide-react";

import { SectionHeading } from "@/components/accent";
import { formatRange } from "@/lib/content/derive";
import type { Content } from "@/lib/content/schema";

export function EducationList({ c }: { c: Content }) {
  return (
    <ul className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
      {c.education.map((e) => (
        <li key={`${e.school}-${e.start}`} className="glow-card glow-card-hover flex gap-4 p-6">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
            <GraduationCap className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-lg font-semibold">{e.school}</p>
            <p className="text-brand">{e.major}</p>
            <p className="mt-1 text-sm text-muted-foreground">{formatRange(e.start, e.end, c.locale)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Education({ c, section }: { c: Content; section: Content["site"]["sections"][number] }) {
  return (
    <section id="education" data-section aria-labelledby="education-title" className="py-14">
      <SectionHeading id="education-title" title={section.title ?? section.label} description={section.description} />
      <EducationList c={c} />
    </section>
  );
}
