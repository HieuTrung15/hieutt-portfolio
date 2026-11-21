import Link from "next/link";

import { SectionHeading } from "@/components/accent";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { getSummaries } from "@/lib/content";
import { formatRange } from "@/lib/content/derive";
import type { Content } from "@/lib/content/schema";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function Timeline({ c, expandAll = false }: { c: Content; expandAll?: boolean }) {
  const projects = new Map(getSummaries(c.locale).map((p) => [p.slug, p]));
  const dict = t(c.locale).experience;
  const defaults = expandAll ? c.experience.map((e) => e.id) : c.experience.filter((e) => e.end === null).map((e) => e.id);
  return (
    <Accordion type="multiple" defaultValue={defaults}>
      <ol>
        {c.experience.map((e, i) => {
          const current = e.end === null;
          const linked = e.projects.flatMap((slug) => projects.get(slug) ?? []);
          return (
            <li key={e.id} className="relative grid grid-cols-[22px_minmax(0,1fr)] gap-x-5 pb-8 last:pb-0">
              {i < c.experience.length - 1 && <span aria-hidden className="absolute top-8 bottom-0 left-[10.5px] w-0.5 bg-brand-raw/35" />}
              <span
                aria-hidden
                className={cn(
                  "relative mt-6 size-[22px] rounded-full border-2 bg-background",
                  current
                    ? "border-brand-raw shadow-[0_0_12px_var(--brand)] after:absolute after:inset-[4px] after:rounded-full after:bg-brand-raw"
                    : "border-brand-raw/60",
                )}
              />
              <div className="glow-card min-w-0 p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <h3 className="text-lg font-semibold">{e.position}</h3>
                  {current && <Badge variant="brand">{dict.current}</Badge>}
                </div>
                <p className="mt-1 text-brand">{e.company}</p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  <time dateTime={e.start}>{formatRange(e.start, e.end, c.locale)}</time>
                </p>
                {e.summary && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{e.summary}</p>}
                {e.responsibilities.length > 0 && (
                  <AccordionItem value={e.id} className="border-0">
                    <AccordionTrigger className="flex-none py-2.5 text-[13px] text-brand">
                      {dict.responsibilities(e.responsibilities.length)}
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-1.5 text-sm text-muted-foreground">
                        {e.responsibilities.map((r) => (
                          <li key={r} className="flex gap-2.5">
                            <span className="mt-2 size-1 shrink-0 rounded-full bg-faint" aria-hidden />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                )}
                {e.technologies.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {e.technologies.map((t) => (
                      <Badge key={t} variant="mono">
                        {t}
                      </Badge>
                    ))}
                  </div>
                )}
                {linked.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-xs text-muted-foreground">{dict.projects}</span>
                    {linked.map((p) => (
                      <Link
                        key={p.slug}
                        href={p.href}
                        className="inline-flex min-h-7 items-center rounded-md border bg-background px-2 text-xs font-medium transition-colors hover:border-brand/50 hover:text-brand"
                      >
                        {p.shortTitle}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </Accordion>
  );
}

export function Experience({ c, section }: { c: Content; section: Content["site"]["sections"][number] }) {
  return (
    <section id="experience" data-section aria-labelledby="experience-title" className="py-14">
      <SectionHeading id="experience-title" title={section.title ?? section.label} description={section.description} />
      <div className="mx-auto max-w-4xl">
        <Timeline c={c} />
      </div>
    </section>
  );
}
