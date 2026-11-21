"use client";

import { useEffect, useState } from "react";

/** Types and deletes each word in turn. Server HTML shows the first word, so it reads fine without JS. */
export function Typewriter({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  const [length, setLength] = useState(words[0]?.length ?? 0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (words.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const word = words[index];
    const delay = deleting ? 45 : length === word.length ? 1800 : 95;
    const id = setTimeout(() => {
      if (!deleting && length === word.length) setDeleting(true);
      else if (deleting && length === 0) {
        setDeleting(false);
        setIndex((index + 1) % words.length);
      } else setLength(length + (deleting ? -1 : 1));
    }, delay);
    return () => clearTimeout(id);
  }, [words, index, length, deleting]);

  return (
    <p className="min-h-[1.5em] text-[1.55rem] font-semibold text-brand sm:text-[2.2rem]">
      <span className="sr-only">{words.join(" · ")}</span>
      <span aria-hidden>
        {words[index]?.slice(0, length)}
        <span className="caret font-normal">|</span>
      </span>
    </p>
  );
}
