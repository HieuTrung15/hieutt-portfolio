/** Accent-insensitive Vietnamese matching: "nhan su" finds "nhân sự". */
export const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();

/** True when every whitespace-separated term of `query` appears somewhere in `fields`. */
export const matches = (query: string, fields: (string | undefined)[]) => {
  const haystack = normalize(fields.filter(Boolean).join(" "));
  return normalize(query).split(/\s+/).filter(Boolean).every((t) => haystack.includes(t));
};
