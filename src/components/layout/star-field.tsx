"use client";

import { useEffect, useRef } from "react";

/** Slowly drifting, twinkling stars behind every page. Static when reduced motion is requested. */
export function StarField() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const starColor = () => getComputedStyle(document.documentElement).getPropertyValue("--star").trim() || "255, 255, 255";
    let color = starColor();
    let stars: { x: number; y: number; r: number; a: number; da: number; vx: number; vy: number }[] = [];
    let w = 0;
    let h = 0;
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: Math.round((w * h) / 9000) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.1 + 0.2,
        a: Math.random() * 0.9 + 0.1,
        da: (Math.random() * 0.008 + 0.002) * (Math.random() < 0.5 ? -1 : 1),
        vx: (Math.random() - 0.5) * 0.06,
        vy: (Math.random() - 0.5) * 0.06,
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        if (!reduce) {
          s.x = (s.x + s.vx + w) % w;
          s.y = (s.y + s.vy + h) % h;
          s.a += s.da;
          if (s.a > 1 || s.a < 0.1) s.da *= -1;
        }
        ctx.fillStyle = `rgba(${color}, ${s.a.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    const onResize = () => {
      resize();
      if (reduce) draw();
    };
    // Re-tint when the theme class on <html> changes.
    const observer = new MutationObserver(() => {
      color = starColor();
      if (reduce) draw();
    });

    resize();
    draw();
    window.addEventListener("resize", onResize);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      observer.disconnect();
    };
  }, []);
  return <canvas ref={ref} aria-hidden className="no-print pointer-events-none fixed inset-0 -z-10 size-full" />;
}
