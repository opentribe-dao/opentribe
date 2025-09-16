"use client";

import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import type * as React from "react";

import { useHoverBackground } from "@packages/base/hooks/use-hover-background";
import { cn } from "@packages/base/lib/utils";

const buttonVariants = cva(
  "hover-bg disabled:opacity-50'size-'])]:size-4 inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium text-sm outline-none transition-all [&_svg:not([class*= focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:bg-bg-disabled [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow hover:bg-destructive/90",
        outline:
          "border border-white/10 bg-bg-idle text-foreground backdrop-blur-sm hover:bg-bg-hover",
        secondary:
          "border border-white/10 bg-bg-idle text-foreground backdrop-blur-sm hover:bg-bg-hover",
        ghost: "text-foreground hover:bg-bg-hover hover:backdrop-blur-sm",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  style,
  onMouseMove,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  const hoverProps =
    variant !== "link"
      ? useHoverBackground({ style, onMouseMove })
      : { style, onMouseMove };

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
      {...hoverProps}
    />
  );
}

export { Button, buttonVariants };
