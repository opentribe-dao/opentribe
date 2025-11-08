import { cn } from "../../lib/utils";

type WordmarkSize = "sm" | "md" | "lg" | "xl";
type WordmarkAppearance = "light" | "dark";

interface WordmarkProps {
  size?: WordmarkSize;
  className?: string;
  appearance?: WordmarkAppearance;
}

const sizeMap: Record<WordmarkSize, string> = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
};

const appearanceClasses: Record<WordmarkAppearance, string> = {
  dark: "bg-gradient-to-r from-white/35 to-white bg-clip-text text-transparent",
  light: "text-neutral-900 dark:text-white",
};

export function Wordmark({
  size = "md",
  className,
  appearance = "dark",
}: WordmarkProps) {
  return (
    <span
      className={cn(
        "font-bold font-heading tracking-[0.25em]",
        appearanceClasses[appearance],
        sizeMap[size],
        className
      )}
    >
      OPENTRIBE
    </span>
  );
}
