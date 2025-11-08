import { cn } from "../../lib/utils";
import { Logomark } from "./logomark";
import { Wordmark } from "./wordmark";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  if (!showText) {
    return <Logomark size={size} className={className} />;
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
      <Wordmark size={size} />
    </div>
  );
}

// Re-export individual components for direct use
export { Logomark } from "./logomark";
export { Wordmark } from "./wordmark";
