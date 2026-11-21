import { Globe, Mail, MapPin } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SocialIcon } from "@/components/layout/social-icon";
import { getContent, getCvHref, getProjects, getSiteUrl, visibleSocialLinks } from "@/lib/content";
import { formatRange, projectPeriod } from "@/lib/content/derive";
import { t, type Locale } from "@/lib/i18n";
import { ResumeAction } from "./resume-actions";
import { alternates, siteOgImages } from "./shared";

export function resumeMetadata(locale: Locale): Metadata {
  const c = getContent(locale);
  const description = t(locale).resume.metaDescription(c.profile.name);
  return {
    title: c.site.pageLabels.resume,
    description,
    openGraph: { type: "profile", title: `${c.site.pageLabels.resume} | ${c.profile.name}`, description, images: siteOgImages(locale) },
    alternates: alternates(c, "/resume"),
  };
}

const ACCENT = "#e8336d";

/** Section title styled like a typeset CV: first letters in the accent colour, rule to the right. */
function PaperSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-9">
      <h2 className="flex items-end gap-3 text-[1.55rem] leading-none font-bold text-[#333]">
        <span className="shrink-0">
          <span style={{ color: ACCENT }}>{title.slice(0, 3)}</span>
          {title.slice(3)}
        </span>
        <span aria-hidden className="mb-1 h-px flex-1 bg-[#555]" />
      </h2>
      {children}
    </section>
  );
}

function Entry({ title, aside, sub, period, bullets }: { title: string; aside?: string; sub?: string; period?: string; bullets: string[] }) {
  return (
    <div className="mt-5 break-inside-avoid">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h3 className="text-[1.08rem] font-bold text-[#333]">{title}</h3>
        {aside && (
          <span className="text-sm italic" style={{ color: ACCENT }}>
            {aside}
          </span>
        )}
      </div>
      {(sub || period) && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm">
          <p className="font-medium text-[#555]">{sub}</p>
          <span className="text-[#777] italic">{period}</span>
        </div>
      )}
      {bullets.length > 0 && (
        <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-[0.93rem] leading-snug text-[#444] marker:text-[#999]">
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The résumé as a white "paper" sheet built from the same content as the rest of the site. */
export function ResumePage({ locale }: { locale: Locale }) {
  const c = getContent(locale);
  const dict = t(locale).resume;
  const cvHref = getCvHref(c);
  const url = getSiteUrl(c);
  const words = c.profile.name.split(/\s+/);
  const groups = c.skills.groups
    .map((g) => ({ title: g.title, skills: c.skills.skills.filter((s) => s.group === g.id && s.visible).map((s) => s.name) }))
    .filter((g) => g.skills.length);
  const action = <ResumeAction cvHref={cvHref} downloadLabel={dict.download} printLabel={dict.print} />;

  return (
    <div className="mx-auto max-w-[1100px] px-3 py-10 sm:px-8">
      <h1 className="sr-only">
        {c.site.pageLabels.resume} — {c.profile.name}
      </h1>
      <div className="no-print flex justify-center">{action}</div>

      <article
        className="resume-paper mx-auto mt-10 bg-white px-5 py-10 text-[#333] shadow-[0_10px_40px_rgba(0,0,0,0.35)] sm:px-14 sm:py-12"
        style={{ fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
      >
        <header className="text-center">
          <p className="text-[2.3rem] leading-tight font-light text-[#333] sm:text-[3.2rem]">
            {words.slice(0, -1).join(" ")} <strong className="font-bold">{words.at(-1)}</strong>
          </p>
          <p className="mt-1 text-sm text-[#777] italic">{c.profile.title}</p>
          <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[0.8rem] text-[#444]">
            <li className="inline-flex items-center gap-1">
              <MapPin className="size-3" aria-hidden /> {c.profile.location}
            </li>
            <li className="inline-flex items-center gap-1">
              <Mail className="size-3" aria-hidden />
              <a href={`mailto:${c.profile.email}`}>{c.profile.email}</a>
            </li>
            {url && (
              <li className="inline-flex items-center gap-1">
                <Globe className="size-3" aria-hidden />
                <a href={url}>{url.replace(/^https:\/\//, "")}</a>
              </li>
            )}
            {visibleSocialLinks(c).map((l) => (
              <li key={l.url} className="inline-flex items-center gap-1">
                <SocialIcon icon={l.icon} className="size-3" />
                <a href={l.url}>{l.label}</a>
              </li>
            ))}
          </ul>
        </header>

        <PaperSection title={dict.work}>
          {c.experience.map((e) => (
            <Entry key={e.id} title={e.company} sub={e.position} period={formatRange(e.start, e.end, locale)} bullets={e.responsibilities} />
          ))}
        </PaperSection>

        <PaperSection title={dict.projects}>
          {getProjects(locale).map((p) => (
            <Entry
              key={p.slug}
              title={p.title}
              aside={p.technologies.join(", ")}
              sub={[p.organization, p.role].filter(Boolean).join(" · ")}
              period={projectPeriod(p, c)?.label}
              bullets={p.responsibilities.length ? p.responsibilities.map((r) => r.text) : [p.summary ?? ""].filter(Boolean)}
            />
          ))}
        </PaperSection>

        <PaperSection title={dict.skills}>
          <dl className="mt-4 grid gap-x-6 gap-y-1.5 text-[0.93rem] sm:grid-cols-[230px_minmax(0,1fr)]">
            {groups.map((g) => (
              <div key={g.title} className="contents">
                <dt className="font-bold text-[#333]">{g.title}</dt>
                <dd className="mb-2 text-[#444] sm:mb-0">{g.skills.join(", ")}</dd>
              </div>
            ))}
          </dl>
        </PaperSection>

        <PaperSection title={dict.education}>
          {c.education.map((e) => (
            <Entry key={`${e.school}-${e.start}`} title={e.school} sub={e.major} period={formatRange(e.start, e.end, locale)} bullets={[]} />
          ))}
        </PaperSection>
      </article>

      <div className="no-print mt-10 flex justify-center">{action}</div>
    </div>
  );
}
