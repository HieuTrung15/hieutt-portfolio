"use client";

import { ArrowRight, Check, Copy, FileText, FolderKanban, Hash, Languages, Layers, Mail, SunMoon } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useLocale, useT } from "@/components/i18n-provider";
import { OPEN_PALETTE_EVENT } from "@/components/layout/search-button";
import { useCopy } from "@/components/layout/copy-button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { LOCALES, rememberLocale, switchLocalePath } from "@/lib/i18n";
import { matches } from "@/lib/search";

export type PaletteData = {
  sections: { id: string; label: string; href: string }[];
  pages: { label: string; href: string }[];
  projects: { slug: string; href: string; title: string; organization?: string; keywords: string[] }[];
  skills: { id: string; name: string; group: string; href: string }[];
  email: string;
};

const filter = (value: string, search: string, keywords?: string[]) => (matches(search, [value, ...(keywords ?? [])]) ? 1 : 0);

export function CommandPalette({ data }: { data: PaletteData }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { state: copyState, copy } = useCopy();
  const t = useT();
  const locale = useLocale();
  const otherLocale = LOCALES.find((l) => l !== locale)!;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen);
    };
  }, []);

  const go = (href: string) => {
    setOpen(false);
    // Same-page anchors use a real fragment navigation so `hashchange` fires (used by the skill explorer).
    const [path] = href.split("#");
    if (href.includes("#") && (path || "/") === pathname) window.location.assign(href);
    else router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showClose={false}
        className="top-[12vh] left-1/2 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl p-0 data-[state=open]:zoom-in-[0.98]"
      >
        <DialogTitle className="sr-only">{t.palette.title}</DialogTitle>
        <DialogDescription className="sr-only">{t.palette.description}</DialogDescription>
        <Command filter={filter} loop>
          <CommandInput placeholder={t.palette.placeholder} aria-label={t.palette.placeholder} />
          <CommandList>
            <CommandEmpty>{t.palette.empty}</CommandEmpty>

            <CommandGroup heading={t.palette.navigation}>
              {data.sections.map((s) => (
                <CommandItem key={s.id} value={`section ${s.label}`} keywords={[s.id]} onSelect={() => go(s.href)}>
                  <Hash aria-hidden />
                  {s.label}
                </CommandItem>
              ))}
              {data.pages.map((p) => (
                <CommandItem key={p.href} value={`page ${p.label}`} keywords={[p.href]} onSelect={() => go(p.href)}>
                  <FileText aria-hidden />
                  {p.label}
                  <CommandShortcut>{p.href}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading={t.palette.projects}>
              {data.projects.map((p) => (
                <CommandItem key={p.slug} value={`project ${p.slug}`} keywords={[p.title, ...p.keywords]} onSelect={() => go(p.href)}>
                  <FolderKanban aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{p.title}</span>
                    {p.organization && <span className="block truncate text-xs text-muted-foreground">{p.organization}</span>}
                  </span>
                  <ArrowRight className="opacity-60" aria-hidden />
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading={t.palette.skills}>
              {data.skills.map((s) => (
                <CommandItem key={s.id} value={`skill ${s.id}`} keywords={[s.name, s.group]} onSelect={() => go(s.href)}>
                  <Layers aria-hidden />
                  {s.name}
                  <CommandShortcut>{s.group}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading={t.palette.actions}>
              <CommandItem value="action copy email" keywords={["email", "copy", "sao chép", data.email]} onSelect={() => copy(data.email)}>
                {copyState === "copied" ? <Check className="text-emerald-600!" aria-hidden /> : <Copy aria-hidden />}
                {copyState === "copied" ? t.palette.copiedEmail : copyState === "error" ? t.common.copyFailed : t.common.copyEmail}
                <CommandShortcut>{data.email}</CommandShortcut>
              </CommandItem>
              <CommandItem value="action send email" keywords={["email", "liên hệ", "contact", "mail"]} onSelect={() => { setOpen(false); window.location.assign(`mailto:${data.email}`); }}>
                <Mail aria-hidden />
                {t.common.sendEmail}
              </CommandItem>
              <CommandItem value="action toggle theme" keywords={["theme", "dark", "light", "giao diện", "tối", "sáng"]} onSelect={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
                <SunMoon aria-hidden />
                {t.common.theme}
              </CommandItem>
              <CommandItem
                value="action switch language"
                keywords={["language", "ngôn ngữ", "english", "tiếng việt", "vi", "en"]}
                onSelect={() => {
                  rememberLocale(otherLocale);
                  go(switchLocalePath(pathname, otherLocale));
                }}
              >
                <Languages aria-hidden />
                {t.palette.switchLanguage}
              </CommandItem>
            </CommandGroup>
          </CommandList>
          <div className="hidden items-center gap-4 border-t px-4 py-2 font-mono text-[11px] text-muted-foreground sm:flex">
            {t.palette.hints.map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
