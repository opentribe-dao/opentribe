import { AnalyticsProvider } from '@packages/analytics';
import { AuthProvider } from '@packages/auth/provider';
import type { ThemeProviderProps } from 'next-themes';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { ThemeProvider } from './providers/theme';

export const BaseProvider = ({
  children,
  ...properties
}: ThemeProviderProps) => (
  <ThemeProvider {...properties}>
    <AnalyticsProvider>
      <AuthProvider>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </AuthProvider>
    </AnalyticsProvider>
  </ThemeProvider>
);

// Export components
export { Background } from './components/background';
export { MarkdownEditor } from './components/ui/markdown-editor';
export type { MarkdownEditorProps } from './components/ui/markdown-editor';
export { ImageUpload } from './components/ui/image-upload';
export { FileUpload } from './components/ui/file-upload';
