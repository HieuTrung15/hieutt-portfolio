import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { localePath, t, type Locale } from "@/lib/i18n";

export function NotFoundContent({ locale, secondary = false }: { locale: Locale; secondary?: boolean }) {
  const dict = t(locale).notFound;
  const Heading = secondary ? "h2" : "h1";
  return (
    <div className={secondary ? "mx-auto flex max-w-[1120px] flex-col items-start px-6 pt-10 sm:px-10" : "mx-auto flex min-h-[60dvh] max-w-[1120px] flex-col items-start justify-center px-6 py-20 sm:px-10"}>
      {!secondary && <p className="font-mono text-sm text-brand">404 · not found</p>}
      <Heading className={secondary ? "text-xl font-semibold tracking-tight" : "mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"}>
        {dict.title}
      </Heading>
      <p className="mt-3 max-w-md text-muted-foreground">{dict.text}</p>
      <div className={secondary ? "mt-5 flex flex-wrap gap-3" : "mt-8 flex flex-wrap gap-3"}>
        <Button asChild>
          <Link href={localePath(locale, "/")}>
            <ArrowLeft aria-hidden /> {dict.home}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={localePath(locale, "/projects")}>
            <Search aria-hidden /> {dict.projects}
          </Link>
        </Button>
      </div>
    </div>
  );
}
