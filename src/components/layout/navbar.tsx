"use client";

import { FileText, House, Presentation, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useT } from "@/components/i18n-provider";
import { stripLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { LanguageSwitch } from "./language-switch";
import { SearchButton } from "./search-button";
import { ThemeToggle } from "./theme-toggle";

/** `href` is localized; `base` is the language-neutral path used to mark the current page. */
export type NavItem = { href: string; base: string; label: string; icon: "home" | "about" | "projects" | "resume" };

const ICONS: Record<NavItem["icon"], LucideIcon> = { home: House, about: UserRound, projects: Presentation, resume: FileText };

export function Navbar({ logo, homeHref, items }: { logo: string; homeHref: string; items: NavItem[] }) {
  const t = useT();
  const pathname = usePathname();
  const path = stripLocale(pathname);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY >= 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "no-print fixed inset-x-0 top-0 z-40 transition-all duration-300",
        (scrolled || open) && "bg-[var(--nav-scrolled)] shadow-[0_10px_10px_0_rgba(9,5,29,0.17)] backdrop-blur-[15px]",
      )}
    >
      <nav aria-label={t.nav.main} className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between px-5 py-2 sm:px-8">
        <Link href={homeHref} className="py-1 text-[1.75rem] font-bold tracking-tight text-brand" aria-label={t.nav.home}>
          {logo}
        </Link>

        <button
          type="button"
          className="relative flex size-10 cursor-pointer flex-col items-center justify-center gap-[6px] lg:hidden"
          aria-expanded={open}
          aria-controls="site-menu"
          aria-label={t.nav.toggleMenu}
          onClick={() => setOpen((o) => !o)}
        >
          <span className={cn("block h-1 w-7 rounded bg-brand transition-transform duration-300", open && "translate-y-[10px] rotate-45")} />
          <span className={cn("block h-1 w-7 rounded bg-brand transition-opacity duration-300", open && "opacity-0")} />
          <span className={cn("block h-1 w-7 rounded bg-brand transition-transform duration-300", open && "-translate-y-[10px] -rotate-45")} />
        </button>

        <div
          id="site-menu"
          className={cn(
            "w-full flex-col items-center gap-4 pb-4 lg:flex lg:w-auto lg:flex-row lg:gap-2 lg:pb-0",
            open ? "flex" : "hidden",
          )}
        >
          <ul className="flex flex-col items-center gap-1 lg:flex-row lg:gap-0">
            {items.map((item) => {
              const Icon = ICONS[item.icon];
              const current = item.base === "/" ? path === "/" : path === item.base || path.startsWith(`${item.base}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className="nav-underline flex items-center gap-2 px-4 py-3 text-[1.15rem] text-foreground lg:py-[0.8rem]"
                  >
                    <Icon className="size-[18px]" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center gap-1.5 lg:ml-3">
            <SearchButton compact className="text-foreground" />
            <LanguageSwitch />
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </header>
  );
}
