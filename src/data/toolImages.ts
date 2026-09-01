import type { Tool } from "@/types";

/**
 * Every tool gets a deterministic, language-neutral visual thumbnail.
 * The artwork lives in /public/tool-images so it can also be used as an
 * Open Graph image without importing a large image bundle into the app.
 */
export function getToolImage(tool: Pick<Tool, "slug">): string {
  return `/tool-images/${tool.slug}.svg`;
}
