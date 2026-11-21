import { ResumePage, resumeMetadata } from "@/components/pages/resume";

export const generateMetadata = () => resumeMetadata("vi");

export default function Page() {
  return <ResumePage locale="vi" />;
}
