import { OG_SIZE, siteOgImage } from "@/lib/og";

export const dynamic = "force-static";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Portfolio — ERPNext Developer & Enterprise Software Engineer";

export default function Image() {
  return siteOgImage("vi");
}
