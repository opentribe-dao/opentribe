"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@packages/base/lib/utils"
import { useHoverBackground } from "@packages/base/hooks/use-hover-background"

const buttonVariants = cva(
  "hover-bg inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 disabled:bg-bg-disabled [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow hover:bg-destructive/90",
        outline:
          "border border-white/10 bg-bg-idle backdrop-blur-sm hover:bg-bg-hover text-foreground",
        secondary:
          "bg-bg-idle backdrop-blur-sm text-foreground hover:bg-bg-hover border border-white/10",
        ghost:
          "hover:bg-bg-hover hover:backdrop-blur-sm text-foreground",
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
)

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean
    }
>(
  ({ className, variant, size, asChild = false, style, onMouseMove, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const hoverProps = variant !== "link" ? useHoverBackground({ style, onMouseMove }) : { style, onMouseMove }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
        {...hoverProps}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
