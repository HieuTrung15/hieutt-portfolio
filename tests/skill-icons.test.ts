import assert from "node:assert/strict";
import { test } from "node:test";

import { loadContent } from "../src/lib/content/load.ts";
import { luminance, SKILL_ICONS } from "../src/lib/skill-icons.ts";

test("luminance picks which brand colours need adjusting", () => {
  assert.equal(luminance("000000"), 0);
  assert.equal(luminance("ffffff"), 1);
  // Lightened on the dark theme (< 0.1): MariaDB, Jinja, Odoo, CSS
  for (const hex of ["003545", "7E0C1B", "714B67", "663399"]) assert.ok(luminance(hex) < 0.1, hex);
  // Darkened on the light theme (> 0.5): JavaScript, React
  for (const hex of ["F7DF1E", "61DAFB"]) assert.ok(luminance(hex) > 0.5, hex);
  // Used as-is: Python, MySQL, PostgreSQL, ERPNext, HTML5
  for (const hex of ["3776AB", "4479A1", "4169E1", "0089FF", "E34F26"]) {
    const l = luminance(hex);
    assert.ok(l >= 0.1 && l <= 0.5, `${hex} ${l}`);
  }
});

test("every skill has a known icon", () => {
  const skills = loadContent(process.cwd()).skills.skills;
  const unknown = skills.filter((s) => !s.icon || !(SKILL_ICONS as readonly string[]).includes(s.icon)).map((s) => s.id);
  assert.deepEqual(unknown, []);
});
