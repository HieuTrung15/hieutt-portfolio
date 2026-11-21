"use client";

import { Search } from "lucide-react";
import { useSyncExternalStore } from "react";

import { useT } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

export const OPEN_PALETTE_EVENT = "open-command-palette";
export const openPalette = () => window.dispatchEvent(new Event(OPEN_PALETTE_EVENT));

const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/** "⌘K" on Apple devices, "Ctrl K" elsewhere (server renders "Ctrl K"). */
export function useShortcutLabel() {
  return useSyncExternalStore(
    () => () => {},
    () => (isMac() ? "⌘K" : "Ctrl K"),
    () => "Ctrl K",
  );
}

export function SearchButton({ compact = false, className }: { compact?: boolean; className?: string }) {
  const shortcut = useShortcutLabel();
  const t = useT().search;
  if (compact)
    return (
      <button
        type="button"
        onClick={openPalette}
        className={cn("inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground", className)}
        aria-label={t.open}
      >
        <Search className="size-[18px]" aria-hidden />
      </button>
    );
  return (
    <button
      type="button"
      data-close-drawer=""
      onClick={openPalette}
      className={cn(
        "flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg border bg-background px-2.5 text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground",
        className,
      )}
      aria-label={`${t.aria} (${shortcut})`}
    >
      <Search className="size-4 text-faint" aria-hidden />
      <span>{t.button}</span>
      <kbd className="ml-auto rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">{shortcut}</kbd>
    </button>
  );
}
