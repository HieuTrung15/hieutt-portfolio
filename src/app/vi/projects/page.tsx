import { ProjectsPage, projectsMetadata } from "@/components/pages/projects";

export const generateMetadata = () => projectsMetadata("vi");

export default function Page() {
  return <ProjectsPage locale="vi" />;
}
