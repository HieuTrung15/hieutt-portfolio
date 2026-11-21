import { HomePage, homeMetadata } from "@/components/pages/home";

export const generateMetadata = () => homeMetadata("en");

export default function Page() {
  return <HomePage locale="en" />;
}
