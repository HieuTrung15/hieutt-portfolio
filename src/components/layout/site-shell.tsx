import { Mail } from "lucide-react";
import type { ReactNode } from "react";

import { getContent, visibleSocialLinks } from "@/lib/content";
import { localePath, t, type Locale } from "@/lib/i18n";
import { initials } from "./avatar";
import { Navbar, type NavItem } from "./navbar";
import { SocialIcon } from "./social-icon";

export function navItems(locale: Locale): NavItem[] {
  const { pageLabels } = getContent(locale).site;
  return [
    { href: localePath(locale, "/"), base: "/", label: pageLabels.home, icon: "home" },
    { href: localePath(locale, "/about"), base: "/about", label: pageLabels.about, icon: "about" },
    { href: localePath(locale, "/projects"), base: "/projects", label: pageLabels.projects, icon: "projects" },
    { href: localePath(locale, "/resume"), base: "/resume", label: pageLabels.resume, icon: "resume" },
  ];
}

export function SiteShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const c = getContent(locale);
  const dict = t(locale);
  const links = [{ href: `mailto:${c.profile.email}`, label: c.profile.email, icon: null }, ...visibleSocialLinks(c).map((l) => ({ href: l.url, label: l.label, icon: l.icon }))];
  return (
    <>
      <a
        href="#main"
        className="no-print sr-only z-[60] rounded-md bg-background px-3 py-2 text-sm shadow focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {dict.nav.skip}
      </a>
      <Navbar logo={c.site.logoText} homeHref={localePath(locale, "/")} items={navItems(locale)} />
      <main id="main" tabIndex={-1} className="relative min-h-dvh pt-20 outline-none">
        {children}
      </main>
      <footer className="no-print relative bg-[var(--footer)] py-3 text-[0.95rem]">
        <div className="mx-auto grid max-w-[1320px] items-center gap-2 px-6 text-center md:grid-cols-3">
          <p className="py-1 font-medium md:text-left">{dict.footer.designedBy(c.profile.name)}</p>
          <p className="py-1 font-medium">{dict.footer.copyright(new Date().getFullYear(), initials(c.profile.name))}</p>
          <ul className="flex justify-center gap-5 py-1 md:justify-end">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  aria-label={l.label}
                  title={l.label}
                  {...(l.icon && { target: "_blank", rel: "noopener noreferrer" })}
                  className="inline-flex size-8 items-center justify-center text-foreground transition-colors hover:text-brand"
                >
                  {l.icon ? <SocialIcon icon={l.icon} /> : <Mail className="size-4" aria-hidden />}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </>
  );
}
