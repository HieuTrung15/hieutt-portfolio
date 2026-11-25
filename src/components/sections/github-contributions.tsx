import { ArrowUpRight } from "lucide-react";

import { SectionHeading } from "@/components/accent";
import type { Content } from "@/lib/content/schema";
import { activeDays, loadGithubContributions } from "@/lib/github/data";
import { leadingBlanks, type ContributionDay } from "@/lib/github/parse";
import { t } from "@/lib/i18n";

const CELL = "size-[11px] rounded-[2px]";
/** 2026-11-22 is a Sunday — any Sunday works, it only feeds the weekday formatter. */
const SUNDAY = Date.UTC(2026, 10, 22);
const utc = (date: string) => new Date(`${date}T00:00:00Z`);

/**
 * GitHub contribution heatmap for the last 12 months, rendered at build time from
 * src/data/github-contributions.json. No client JS: tooltips are native `title`, and the mobile
 * scroll starts at the most recent week via the direction trick below.
 *
 * Renders nothing at all when there is no snapshot (a clone that has not run `pnpm sync:github`),
 * rather than showing an empty frame or an error a visitor cannot act on.
 */
export function GithubContributions({ c, section }: { c: Content; section: Content["site"]["sections"][number] }) {
  const year = loadGithubContributions();
  if (!year?.days.length) return null;

  const dict = t(c.locale).github;
  const intl = c.locale === "vi" ? "vi-VN" : "en-US";
  // Each language's house date convention, matching formatMonth() in content/derive.ts:
  // English names the month ("Nov 24, 2026"), Vietnamese stays numeric ("24/11/2026").
  const dayFormat = new Intl.DateTimeFormat(
    intl,
    c.locale === "vi"
      ? { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }
      : { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" },
  );
  const monthFormat = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
  const weekdayFormat = new Intl.DateTimeFormat(intl, { weekday: "short", timeZone: "UTC" });

  // Blank cells keep column one aligned to the weekday rows when the calendar does not open on a
  // Sunday. GitHub's always does, so today this is 0 — it is here so the grid cannot shear if that
  // ever changes.
  const cells: (ContributionDay | null)[] = [...Array<null>(leadingBlanks(year.days[0].date)).fill(null), ...year.days];
  const weeks = Array.from({ length: Math.ceil(cells.length / 7) }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  // A column is labelled when its first real day opens a month the previous column did not.
  let labelled = -1;
  const months = weeks.map((week) => {
    const first = week.find((d): d is ContributionDay => d !== null);
    if (!first) return "";
    const date = utc(first.date);
    const month = date.getUTCMonth();
    if (month === labelled) return "";
    labelled = month;
    // Vietnamese stays numeric (T11) like formatMonth() in content/derive.ts; Intl would say
    // "thg 11", a form this site uses nowhere.
    return c.locale === "vi" ? `T${month + 1}` : monthFormat.format(date);
  });

  return (
    <section id="github" data-section aria-labelledby="github-title" className="py-14">
      <SectionHeading id="github-title" title={section.title ?? section.label} description={section.description} />
      <div className="glow-card mx-auto max-w-4xl p-6">
        <p className="mb-5 text-sm text-muted-foreground">{dict.summary(year.total, activeDays(year))}</p>

        {/* Below lg the grid is wider than the card, so the box scrolls; RTL makes it open on the
            most recent week without a script. At lg and up it fits, and LTR keeps it left-aligned. */}
        <div className="overflow-x-auto pb-1 [direction:rtl] lg:[direction:ltr]">
          <div className="inline-flex gap-2 [direction:ltr]">
            <div className="grid gap-[3px] pt-[14px] text-[0.65rem] text-faint" style={{ gridTemplateRows: "repeat(7, 11px)" }} aria-hidden>
              {Array.from({ length: 7 }, (_, row) => (
                <span key={row} className="leading-[11px] whitespace-nowrap">
                  {row % 2 === 1 ? weekdayFormat.format(SUNDAY + row * 86_400_000) : ""}
                </span>
              ))}
            </div>

            <div>
              <div
                className="mb-[3px] grid h-[11px] gap-[3px] text-[0.65rem] leading-[11px] text-faint"
                style={{ gridTemplateColumns: `repeat(${weeks.length}, 11px)` }}
                aria-hidden
              >
                {months.map((label, i) => (
                  <span key={i} className="whitespace-nowrap">
                    {label}
                  </span>
                ))}
              </div>

              <div
                role="img"
                aria-label={dict.graphLabel(year.total)}
                className="grid grid-flow-col gap-[3px]"
                style={{ gridTemplateRows: "repeat(7, 11px)" }}
              >
                {cells.map((day, i) =>
                  day ? (
                    <span
                      key={day.date}
                      aria-hidden
                      title={dict.day(day.count, dayFormat.format(utc(day.date)))}
                      className={CELL}
                      style={{ background: `var(--gh-${day.level})` }}
                    />
                  ) : (
                    <span key={`blank-${i}`} aria-hidden className={CELL} />
                  ),
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-faint">
          <span className="flex items-center gap-1.5">
            {dict.less}
            {[0, 1, 2, 3, 4].map((level) => (
              <span key={level} aria-hidden className={CELL} style={{ background: `var(--gh-${level})` }} />
            ))}
            {dict.more}
          </span>
          <a
            href={year.profileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-brand transition-opacity hover:opacity-80"
          >
            {dict.viewProfile}
            <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
