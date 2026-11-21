import { Download, Mail } from "lucide-react";

import { Accent } from "@/components/accent";
import { CopyButton } from "@/components/layout/copy-button";
import { SocialIcon } from "@/components/layout/social-icon";
import { visibleSocialLinks } from "@/lib/content";
import type { Content } from "@/lib/content/schema";
import { t } from "@/lib/i18n";

/** "Find Me On": white social circles (email, copy email, configured profiles, CV when present). */
export function Contact({ c, section, cvHref }: { c: Content; section: Content["site"]["sections"][number]; cvHref?: string }) {
  const dict = t(c.locale);
  const social = visibleSocialLinks(c);
  return (
    <section id="contact" data-section aria-labelledby="contact-title" className="mx-auto max-w-[1320px] px-6 py-16 text-center sm:px-10">
      <h2 id="contact-title" className="text-[2.1rem] font-medium sm:text-[2.5rem]">
        <Accent text={section.title ?? section.label} />
      </h2>
      <p className="mt-3">
        <Accent text={dict.findMe.connect} />
      </p>
      <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">{c.profile.contact.heading}</span> {c.profile.contact.description}
      </p>
      <ul className="mt-8 flex flex-wrap justify-center gap-6">
        <li>
          <a href={`mailto:${c.profile.email}`} className="social-circle" aria-label={dict.findMe.email} title={dict.findMe.email}>
            <Mail className="size-[18px]" aria-hidden />
          </a>
        </li>
        <li>
          <CopyButton value={c.profile.email} label={dict.findMe.copy} iconOnly className="social-circle" />
        </li>
        {social.map((l) => (
          <li key={l.url}>
            <a href={l.url} target="_blank" rel="noopener noreferrer" className="social-circle" aria-label={l.label} title={l.label}>
              <SocialIcon icon={l.icon} className="size-[18px]" />
            </a>
          </li>
        ))}
        {cvHref && (
          <li>
            <a href={cvHref} download className="social-circle" aria-label={dict.common.downloadCv} title={dict.common.downloadCv}>
              <Download className="size-[18px]" aria-hidden />
            </a>
          </li>
        )}
      </ul>
      <p className="mt-6">
        <a href={`mailto:${c.profile.email}`} className="break-all text-brand hover:underline">
          {c.profile.email}
        </a>
      </p>
    </section>
  );
}
