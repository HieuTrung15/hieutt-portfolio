// Reads the contribution snapshot produced by tools/fetch-github-contributions.ts.
// Cached per request in dev, once per build in production — same shape as src/lib/content/index.ts.
//
// Read with fs rather than `import`: the file is generated, so a fresh clone that has not run
// `pnpm sync:github` must still compile. A missing file is a normal state, not an error — the
// heatmap section simply does not render.
import fs from "node:fs";
import path from "node:path";
import { cache } from "react";

import type { ContributionYear } from "./parse.ts";

export const DATA_FILE = path.join(process.cwd(), "src/data/github-contributions.json");

/** Null for anything that is not a usable snapshot: absent, unparseable, or the wrong shape. */
export function readContributionsFile(file: string): ContributionYear | null {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as ContributionYear;
    return Array.isArray(parsed?.days) && parsed.days.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export const loadGithubContributions = cache(() => readContributionsFile(DATA_FILE));

export const activeDays = (year: ContributionYear) => year.days.filter((d) => d.count > 0).length;
