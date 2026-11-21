import type { Content } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

export const initials = (name: string) => {
  const words = name.trim().split(/\s+/);
  return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
};

/** Profile photo if configured, otherwise initials on a purple disc. */
export function Avatar({ c, size = 44, className }: { c: Content; size?: number; className?: string }) {
  const { profile } = c;
  return profile.avatar ? (
    // eslint-disable-next-line @next/next/no-img-element -- static export, images are unoptimized anyway
    <img src={profile.avatar} alt={profile.name} width={size} height={size} className={cn("shrink-0 rounded-full object-cover", className)} style={{ width: size, height: size }} />
  ) : (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-[#8e44ad] font-bold text-white", className)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(profile.name)}
    </span>
  );
}
