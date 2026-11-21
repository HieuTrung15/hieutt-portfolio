"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { useT } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

export function useCopy() {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("error");
    }
    setTimeout(() => setState("idle"), 1800);
  };
  return { state, copy };
}

/** Copies `value` (or the current page URL when value is omitted) with visible + screen-reader feedback. */
export function CopyButton({
  value,
  label,
  copiedLabel,
  className,
  iconOnly = false,
}: {
  value?: string;
  label: string;
  copiedLabel?: string;
  className?: string;
  iconOnly?: boolean;
}) {
  const t = useT();
  const { state, copy } = useCopy();
  const text = state === "copied" ? (copiedLabel ?? t.common.copied) : state === "error" ? t.common.copyFailed : label;
  return (
    <button
      type="button"
      onClick={() => copy(value ?? window.location.href)}
      className={cn("inline-flex cursor-pointer items-center gap-2 rounded-lg text-sm font-medium transition-colors", className)}
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? label : undefined}
    >
      {state === "copied" ? <Check className="size-4 text-emerald-600" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {!iconOnly && <span>{text}</span>}
      <span className="sr-only" aria-live="polite">
        {state === "idle" ? "" : text}
      </span>
    </button>
  );
}
