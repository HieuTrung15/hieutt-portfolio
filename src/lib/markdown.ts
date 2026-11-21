// Shared markdown setup for case studies (site + Content Studio preview). No JSX so Node can import it.
// Raw HTML in markdown is skipped: content stays data, never executable markup.
import { createElement } from "react";
import type { Components, Options } from "react-markdown";
import remarkGfm from "remark-gfm";

// react-markdown passes the AST `node`; it must not reach the DOM.
const withoutNode = <T extends { node?: unknown }>(props: T) => {
  const rest = { ...props };
  delete rest.node;
  return rest;
};

// Case study markdown sits under an h2 section heading, so its headings start at h3.
const heading = (tag: "h3" | "h4"): Components["h1"] =>
  function Heading(props) {
    return createElement(tag, withoutNode(props));
  };

export const markdownProps: Omit<Options, "children"> = {
  remarkPlugins: [remarkGfm],
  skipHtml: true,
  components: {
    h1: heading("h3"),
    h2: heading("h3"),
    h3: heading("h4"),
    a: function Anchor(props) {
      const external = props.href?.startsWith("http");
      return createElement("a", { ...withoutNode(props), ...(external && { target: "_blank", rel: "noopener noreferrer" }) });
    },
  },
};
