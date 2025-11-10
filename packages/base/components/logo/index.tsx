import { cn } from "../../lib/utils";
import { Logomark } from "./logomark";
import { Wordmark } from "./wordmark";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  appearance?: "light" | "dark";
}

export function Logo({
  size = "md",
  showText = true,
  className,
  appearance = "dark",
}: LogoProps) {
  if (!showText) {
    return <Logomark className={className} size={size} />;
  }

  // Use a smaller logomark size for better proportion with text
  const logomarkSizeMap: Record<typeof size, "sm" | "md" | "lg" | "xl"> = {
    sm: "sm",
    md: "sm",
    lg: "md",
    xl: "lg",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Logomark size={logomarkSizeMap[size]} />
      <Wordmark appearance={appearance} size={size} />
    </div>
  );
}

// Re-export individual components for direct use
export { Logomark } from "./logomark";
export { Wordmark } from "./wordmark";
