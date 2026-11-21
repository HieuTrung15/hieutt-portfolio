import { AboutPage, aboutMetadata } from "@/components/pages/about";

export const generateMetadata = () => aboutMetadata("vi");

export default function Page() {
  return <AboutPage locale="vi" />;
}
