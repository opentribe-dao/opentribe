import { cn } from "../../lib/utils";

interface WordmarkProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
};

export function Wordmark({ size = "md", className }: WordmarkProps) {
  return (
    <span
      className={cn(
        "bg-gradient-to-r from-white/35 to-white bg-clip-text font-bold font-heading tracking-[0.25em] text-transparent",
        sizeMap[size],
        className
      )}
    >
      OPENTRIBE
    </span>
  );
}
