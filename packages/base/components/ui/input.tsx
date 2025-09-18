"use client";

import * as React from "react";

import { cn } from "@packages/base/lib/utils";
import { useHoverBackground } from "@packages/base/hooks/use-hover-background";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, style, onMouseMove, ...props }, ref) => {
    return (
      <div
        className={cn(
          "hover-bg relative overflow-hidden rounded-lg bg-bg-idle backdrop-blur-sm border border-white/10",
          "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
          "hover:bg-bg-hover transition-colors"
        )}
        {...useHoverBackground({ style, onMouseMove })}
      >
        <input
          type={type}
          data-slot="input"
          className={cn(
            "flex h-9 w-full bg-transparent px-3 py-1 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-secondary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
) as React.ForwardRefExoticComponent<
  React.ComponentProps<"input"> & React.RefAttributes<HTMLInputElement>
>;

Input.displayName = "Input";

export { Input };
