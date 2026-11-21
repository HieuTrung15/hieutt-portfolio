import { ProjectPage, projectMetadata, projectParams } from "@/components/pages/project";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = projectParams;
export const generateMetadata = async ({ params }: Props) => projectMetadata("en", (await params).slug);

export default async function Page({ params }: Props) {
  return <ProjectPage locale="en" slug={(await params).slug} />;
}
