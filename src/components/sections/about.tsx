import { Accent, Emphasize } from "@/components/accent";
import { Avatar } from "@/components/layout/avatar";
import type { Content } from "@/lib/content/schema";
import { paragraphs } from "@/lib/utils";

/** Home "Let me introduce myself" block: key message + short intro, avatar on the right. */
export function About({ c, section }: { c: Content; section: Content["site"]["sections"][number] }) {
  const { profile } = c;
  return (
    <section id="about" data-section aria-labelledby="about-title" className="mx-auto max-w-[1320px] px-6 py-16 sm:px-10">
      <div className="grid items-center gap-12 lg:grid-cols-[2fr_1fr]">
        <div>
          <h2 id="about-title" className="text-center text-[1.9rem] leading-tight font-medium uppercase sm:text-[2.6rem]">
            <Accent text={section.title ?? section.label} />
          </h2>
          <div className="mt-10 space-y-6 text-[1.05rem] leading-[1.9] sm:text-[1.2rem]">
            <p className="font-bold text-brand italic">{profile.statement}</p>
            {paragraphs(profile.intro).map((p) => (
              <p key={p.slice(0, 24)}>
                <Emphasize text={p} terms={profile.coreStack} />
              </p>
            ))}
          </div>
        </div>
        <div className="tilt flex justify-center">
          <Avatar c={c} size={230} className="shadow-[0_0_40px_-6px_var(--brand)]" />
        </div>
      </div>
    </section>
  );
}
