/**
 * Original illustration (no third-party artwork): a monitor showing an ERP dashboard or code, with the
 * owner's own stack/modules floating around it. Colours follow the theme tokens.
 */
// Chip centres, filled in order: corners and sides first, then top/bottom centre.
const SLOTS: [number, number][] = [
  [100, 58],
  [362, 50],
  [62, 208],
  [400, 212],
  [338, 352],
  [112, 346],
  [230, 30],
  [230, 392],
];

export function HeroArt({ labels, variant = "dashboard", label }: { labels: string[]; variant?: "dashboard" | "code"; label: string }) {
  const chips = labels.slice(0, SLOTS.length).map((text, i) => {
    const w = text.length * 7.8 + 26;
    const [cx, cy] = SLOTS[i];
    const x = Math.min(Math.max(cx - w / 2, 4), 456 - w);
    return { text, x, y: cy - 15, w, cx: x + w / 2, cy, delay: `${i * 0.6}s` };
  });
  return (
    <svg viewBox="0 0 460 420" role="img" aria-label={label} className="mx-auto w-full max-w-[460px]">
      <circle cx="230" cy="200" r="165" fill="var(--brand)" opacity="0.09" />
      <ellipse cx="230" cy="378" rx="170" ry="20" fill="var(--brand)" opacity="0.12" />

      {chips.map((c) => (
        <line key={`l-${c.text}`} x1={c.cx} y1={c.cy} x2="230" y2="180" stroke="var(--brand)" strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="4 6" />
      ))}

      {/* monitor */}
      <path d="M208 268h44l12 34h-68z" fill="var(--faint)" opacity="0.55" />
      <rect x="172" y="300" width="116" height="9" rx="4.5" fill="var(--faint)" opacity="0.7" />
      <rect x="104" y="94" width="252" height="176" rx="12" fill="var(--card)" stroke="var(--brand)" strokeWidth="2" />
      <circle cx="122" cy="111" r="4" fill="#ff6b8b" opacity="0.8" />
      <circle cx="135" cy="111" r="4" fill="#ffc35b" opacity="0.8" />
      <circle cx="148" cy="111" r="4" fill="#5bd68a" opacity="0.8" />

      {variant === "dashboard" ? (
        <g>
          <rect x="118" y="124" width="40" height="132" rx="5" fill="var(--brand)" opacity="0.16" />
          {[136, 152, 168, 184].map((y) => (
            <rect key={y} x="126" y={y} width="24" height="5" rx="2.5" fill="var(--brand)" opacity="0.55" />
          ))}
          {[168, 228, 288].map((x, i) => (
            <rect key={x} x={x} y="124" width="54" height="30" rx="5" fill="var(--brand)" opacity={0.18 + i * 0.08} />
          ))}
          {[44, 70, 56, 88, 62, 98].map((h, i) => (
            <rect key={i} x={170 + i * 15} y={250 - h} width="10" height={h} rx="2" fill="var(--brand)" opacity={0.45 + (i % 3) * 0.2} />
          ))}
          <polyline points="268,236 284,214 300,222 316,192 334,204" fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {[
            [268, 236],
            [284, 214],
            [300, 222],
            [316, 192],
            [334, 204],
          ].map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r="3" fill="var(--card)" stroke="var(--brand)" strokeWidth="2" />
          ))}
        </g>
      ) : (
        <g>
          {[
            [120, 70, 0.9],
            [134, 120, 0.5],
            [134, 92, 0.75],
            [148, 140, 0.45],
            [134, 64, 0.75],
            [120, 40, 0.9],
            [120, 110, 0.5],
            [134, 84, 0.45],
          ].map(([x, w, o], i) => (
            <rect key={i} x={x} y={128 + i * 15} width={w} height="6" rx="3" fill={i % 3 === 0 ? "var(--brand)" : "var(--foreground)"} opacity={o} />
          ))}
          <text x="300" y="196" textAnchor="middle" fontSize="40" fontWeight="700" fill="var(--brand)">
            {"</>"}
          </text>
        </g>
      )}

      {chips.map((c) => (
        <g key={c.text} className="float-chip" style={{ animationDelay: c.delay }}>
          <rect x={c.x} y={c.y} width={c.w} height="30" rx="15" fill="var(--card)" stroke="var(--brand)" strokeWidth="1.5" />
          <text x={c.cx} y={c.cy + 4.5} textAnchor="middle" fontSize="13" fill="var(--foreground)">
            {c.text}
          </text>
        </g>
      ))}
    </svg>
  );
}
