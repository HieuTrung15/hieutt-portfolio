import Markdown from "react-markdown";

import { markdownProps } from "@/lib/markdown";

export function MarkdownContent({ children }: { children: string }) {
  return (
    <div className="case-prose">
      <Markdown {...markdownProps}>{children}</Markdown>
    </div>
  );
}
