"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useLocale, useT } from "@/components/i18n-provider";
import { LOCALE_INFO, LOCALES, rememberLocale, switchLocalePath } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** EN | VI toggle linking to the same page in the other language (keeps the #section and remembers the choice). */
export function LanguageSwitch({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  return (
    <div role="group" aria-label={t.common.language} className={cn("inline-flex rounded-lg border bg-background p-0.5", className)}>
      {LOCALES.map((l) => {
        const active = l === locale;
        return (
          <Link
            key={l}
            href={switchLocalePath(pathname, l)}
            hrefLang={LOCALE_INFO[l].htmlLang}
            aria-label={LOCALE_INFO[l].label}
            aria-current={active ? "true" : undefined}
            onClick={(e) => {
              if (active) return e.preventDefault();
              rememberLocale(l);
              if (!window.location.hash) return;
              e.preventDefault();
              router.push(switchLocalePath(pathname, l) + window.location.hash);
            }}
            className={cn(
              "inline-flex h-7 min-w-8 items-center justify-center rounded-md px-1.5 font-mono text-[11px] font-medium transition-colors",
              active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {LOCALE_INFO[l].short}
          </Link>
        );
      })}
    </div>
  );
}
