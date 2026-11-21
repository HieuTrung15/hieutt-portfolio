import { projectParams } from "@/components/pages/project";
import { OG_SIZE, projectOgImage } from "@/lib/og";

export const dynamic = "force-static";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Project case study";
export const generateStaticParams = projectParams;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  return projectOgImage("vi", (await params).slug);
}
