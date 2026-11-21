import { ProjectsPage, projectsMetadata } from "@/components/pages/projects";

export const generateMetadata = () => projectsMetadata("en");

export default function Page() {
  return <ProjectsPage locale="en" />;
}
