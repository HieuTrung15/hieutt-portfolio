import type { ReactNode } from "react";

/** Renders `*word*` in the accent colour, e.g. "Professional *Skillset*". Used for content-driven headings. */
export function Accent({ text, className = "text-brand" }: { text: string; className?: string }) {
  return text.split("*").map((part, i) =>
    i % 2 ? (
      <span key={i} className={className}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Highlights known terms (technologies, platforms) inside a paragraph, in the accent colour. */
export function Emphasize({ text, terms }: { text: string; terms: string[] }): ReactNode {
  const list = terms.filter(Boolean).sort((a, b) => b.length - a.length);
  if (!list.length) return text;
  const pattern = new RegExp(`(${list.map(escape).join("|")})`, "g");
  return text.split(pattern).map((part, i) =>
    i % 2 ? (
      <b key={i} className="font-bold text-brand italic">
        {part}
      </b>
    ) : (
      part
    ),
  );
}

/** Centered section heading with the accent convention. */
export function SectionHeading({ id, title, description, as: Tag = "h2" }: { id?: string; title: string; description?: string; as?: "h1" | "h2" }) {
  return (
    <div className="mb-10 text-center">
      <Tag id={id} className="text-[1.9rem] leading-tight font-medium sm:text-[2.3rem]">
        <Accent text={title} />
      </Tag>
      {description && <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-foreground/85">{description}</p>}
    </div>
  );
}
