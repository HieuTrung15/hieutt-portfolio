import { SectionHeading } from "@/components/accent";
import { fillTokens } from "@/lib/content/derive";
import type { Content } from "@/lib/content/schema";

export function Highlights({ c, section }: { c: Content; section: Content["site"]["sections"][number] }) {
  return (
    <section id="highlights" data-section aria-labelledby="highlights-title" className="mx-auto max-w-[1320px] px-6 py-12 sm:px-10">
      <SectionHeading id="highlights-title" title={section.title ?? section.label} description={section.description} />
      <dl className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {c.highlights.map((h) => (
          <div key={h.description} className="glow-card glow-card-hover p-6 text-center">
            <dt className="sr-only">{h.label ?? h.value}</dt>
            <dd className="text-[1.9rem] font-bold text-brand">
              {fillTokens(h.value, c)}
              {h.label && <span className="ml-2 text-base font-medium text-foreground">{h.label}</span>}
            </dd>
            <dd className="mt-3 text-sm leading-relaxed text-muted-foreground">{h.description}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
