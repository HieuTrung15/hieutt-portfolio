// Parses the public GitHub contribution calendar at https://github.com/users/<user>/contributions.
// Pure string work, no I/O and no Next/React imports, so the build-time script in tools/ and the
// test runner share exactly these rules.
//
// Two things about GitHub's markup drive the design here:
//  - day cells are emitted row-major (one table row per weekday), so document order is NOT
//    chronological — the 1st, 2nd and 3rd cells are seven days apart. Days are sorted by date.
//  - the "Less … More" legend also carries data-level, so cells are matched on the
//    ContributionCalendar-day class, never on data-level alone.

export type ContributionDay = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };

export type ContributionYear = {
  username: string;
  profileUrl: string;
  total: number;
  from: string;
  to: string;
  fetchedAt: string;
  days: ContributionDay[];
};

/** A calendar with fewer days than this is markup we no longer understand, not a quiet year. */
export const MIN_DAYS = 300;

/** GitHub login rules: alphanumeric or single hyphens, cannot start or end with a hyphen, ≤ 39 chars. */
const LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;

const HEADLINE = /id="js-contribution-activity-description"[^>]*>\s*([\d,]+)/;
const DAY_CELL = /<[a-zA-Z][\w-]*\b[^>]*\bclass="(?:[^"]*\s)?ContributionCalendar-day(?:\s[^"]*)?"[^>]*>/g;
const TOOLTIP = /<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([\s\S]*?)<\/tool-tip>/g;

const attr = (tag: string, name: string) => new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1];

/**
 * `headlineTotal` is the figure GitHub prints above the graph. It is reported alongside the days
 * rather than folded into them: the authoritative total is the sum of the cells actually drawn,
 * and the caller cross-checks the two. A missing headline is not an error — the days are the
 * real content, and the feature must not hinge on one element id GitHub may rename.
 *
 * Returns null only when no day cells were found at all.
 */
export function parseContributions(html: string): { headlineTotal: number | null; days: ContributionDay[] } | null {
  const headline = HEADLINE.exec(html)?.[1];
  const headlineTotal = headline === undefined ? null : Number(headline.replace(/,/g, ""));

  const counts = new Map<string, number>();
  for (const [, id, text] of html.matchAll(TOOLTIP)) {
    const n = /^(\d[\d,]*)\s+contribution/.exec(text.trim());
    counts.set(id, n ? Number(n[1].replace(/,/g, "")) : 0);
  }

  const days: ContributionDay[] = [];
  for (const [tag] of html.matchAll(DAY_CELL)) {
    const date = attr(tag, "data-date");
    if (!date) continue;
    const id = attr(tag, "id");
    const level = Math.min(4, Math.max(0, Number(attr(tag, "data-level")) || 0)) as ContributionDay["level"];
    days.push({ date, count: (id && counts.get(id)) || 0, level });
  }
  if (!days.length) return null;

  days.sort((a, b) => a.date.localeCompare(b.date));
  return { headlineTotal, days };
}

/** Empty cells to emit before the first day so column one lines up with the weekday rows. */
export function leadingBlanks(firstDate: string): number {
  return new Date(`${firstDate}T00:00:00Z`).getUTCDay();
}

/**
 * Pulls the account name out of a GitHub profile URL, e.g. https://github.com/HieuTrung15.
 * Returns null for anything that is not one — an empty url (the documented way to hide a social
 * link), a repo or org path, another host, or a name GitHub could not issue. Callers treat null
 * as "nothing to sync", never as a crash.
 */
export function githubUsernameFrom(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.hostname !== "github.com" && parsed.hostname !== "www.github.com") return null;
  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length !== 1) return null;
  return LOGIN.test(segments[0]) ? segments[0] : null;
}
