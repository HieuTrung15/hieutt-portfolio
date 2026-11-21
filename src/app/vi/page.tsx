import { HomePage, homeMetadata } from "@/components/pages/home";

export const generateMetadata = () => homeMetadata("vi");

export default function Page() {
  return <HomePage locale="vi" />;
}
