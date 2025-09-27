import { cn } from "@packages/base/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-white/20 animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
