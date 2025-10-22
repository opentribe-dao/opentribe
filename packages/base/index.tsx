import type { ThemeProviderProps } from "next-themes";
import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { ThemeProvider } from "./providers/theme";

export const BaseProvider = ({
  children,
  ...properties
}: ThemeProviderProps) => (
  <ThemeProvider {...properties}>
    <TooltipProvider>{children}</TooltipProvider>
    <Toaster />
  </ThemeProvider>
);

// Export components
export { Background } from "./components/background";
export { MarkdownEditor } from "./components/ui/markdown-editor";
export type { MarkdownEditorProps } from "./components/ui/markdown-editor";
export { ImageUpload } from "./components/ui/image-upload";
export { FileUpload } from "./components/ui/file-upload";

// Export lib
export { skillsOptions } from "./lib/skills";
