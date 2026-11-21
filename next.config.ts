import type { NextConfig } from "next";

// Static export: production is plain HTML/CSS/JS, so no editing endpoint can exist there.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
