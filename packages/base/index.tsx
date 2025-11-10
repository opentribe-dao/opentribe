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
export { FileUpload } from "./components/ui/file-upload";
export { ImageUpload } from "./components/ui/image-upload";
export type { MarkdownEditorProps } from "./components/ui/markdown-editor";
export { MarkdownEditor } from "./components/ui/markdown-editor";
export type { CookieCategory, CookieConsent } from "./lib/cookie-consent";
export {
  ACCEPT_ALL_CONSENT,
  acceptAllCookies,
  DEFAULT_CONSENT,
  getCookieConsent,
  hasCategoryConsent,
  hasConsent,
  rejectNonEssentialCookies,
  resetConsent,
  setCookieConsent,
  updateCookieConsent,
  useCookieConsent,
} from "./lib/cookie-consent";
// Export lib
export { skillsOptions } from "./lib/skills";
