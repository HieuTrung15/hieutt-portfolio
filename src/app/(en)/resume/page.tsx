import { ResumePage, resumeMetadata } from "@/components/pages/resume";

export const generateMetadata = () => resumeMetadata("en");

export default function Page() {
  return <ResumePage locale="en" />;
}
