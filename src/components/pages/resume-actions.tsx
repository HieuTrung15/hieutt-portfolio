"use client";

import { Download, Printer } from "lucide-react";

const button = "inline-flex min-w-[250px] cursor-pointer items-center justify-center gap-2 rounded-md bg-primary bg-primary-gradient px-6 py-2.5 text-primary-foreground transition hover:brightness-110";

/** Download the uploaded PDF when there is one; otherwise print this page (the browser can save it as PDF). */
export function ResumeAction({ cvHref, downloadLabel, printLabel }: { cvHref?: string; downloadLabel: string; printLabel: string }) {
  return cvHref ? (
    <a href={cvHref} download className={button}>
      <Download className="size-4" aria-hidden /> {downloadLabel}
    </a>
  ) : (
    <button type="button" onClick={() => window.print()} className={button}>
      <Printer className="size-4" aria-hidden /> {printLabel}
    </button>
  );
}
