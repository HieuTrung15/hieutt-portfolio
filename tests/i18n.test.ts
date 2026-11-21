import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";

import { LOCALE_STORAGE_KEY, localeBootScript } from "../src/lib/i18n.ts";

/** Runs the <head> boot script against a fake browser and reports what it did. */
function boot(url: string, { stored = null as string | null, inIframe = false, storageThrows = false } = {}) {
  const { pathname, search, hash } = new URL(url, "https://example.com");
  let redirectedTo: string | null = null;
  const top = {};
  const self = inIframe ? {} : top;
  const sandbox = {
    location: { pathname, search, hash, replace: (to: string) => (redirectedTo = to) },
    localStorage: {
      getItem: (key: string) => {
        if (storageThrows) throw new Error("SecurityError");
        return key === LOCALE_STORAGE_KEY ? stored : null;
      },
    },
    document: { documentElement: { lang: "en-US" } },
    window: { top, self },
  };
  vm.runInNewContext(localeBootScript(), sandbox);
  return { lang: sandbox.document.documentElement.lang, redirectedTo };
}

test("sets <html lang> from the URL", () => {
  assert.equal(boot("/").lang, "en-US");
  assert.equal(boot("/projects/vhrm").lang, "en-US");
  assert.equal(boot("/vi").lang, "vi");
  assert.equal(boot("/vi/projects/vhrm").lang, "vi");
  assert.equal(boot("/video").lang, "en-US", "a path that merely starts with 'vi' is not Vietnamese");
});

test("first-time visitors are never redirected", () => {
  assert.equal(boot("/").redirectedTo, null);
  assert.equal(boot("/projects").redirectedTo, null);
});

test("a remembered Vietnamese choice sends English URLs to the same Vietnamese page", () => {
  assert.equal(boot("/", { stored: "vi" }).redirectedTo, "/vi");
  assert.equal(boot("/projects/vhrm?ref=x#system", { stored: "vi" }).redirectedTo, "/vi/projects/vhrm?ref=x#system");
});

test("URLs that already name a language open as sent", () => {
  assert.equal(boot("/vi/projects", { stored: "en" }).redirectedTo, null);
  assert.equal(boot("/vi", { stored: "vi" }).redirectedTo, null);
  assert.equal(boot("/", { stored: "en" }).redirectedTo, null);
});

test("ignores unknown stored values, iframes and blocked storage", () => {
  assert.equal(boot("/", { stored: "fr" }).redirectedTo, null);
  assert.equal(boot("/", { stored: "vi", inIframe: true }).redirectedTo, null, "Studio preview iframe is not redirected");
  const blocked = boot("/vi/about", { storageThrows: true });
  assert.deepEqual(blocked, { lang: "vi", redirectedTo: null });
});
