import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-colors",
  {
    variants: {
      variant: {
        // Default - Navy branded
        default:
          "border-transparent bg-navy-900 text-cream-50 dark:bg-gold-500 dark:text-navy-900",
        // Secondary - Subtle
        secondary:
          "border-transparent bg-slate-100 text-navy-900 dark:bg-navy-800 dark:text-cream-100",
        // Outline
        outline:
          "border-border text-foreground bg-transparent",
        // Success - Verifisert, Godkjent
        success:
          "border-transparent bg-success/10 text-success",
        // Warning - Venter, Under behandling
        warning:
          "border-transparent bg-warning/10 text-warning",
        // Error/Destructive - Avvist, Utgått
        destructive:
          "border-transparent bg-error/10 text-error",
        // Gold - Premium, Featured
        gold:
          "border-transparent bg-gold-500/10 text-gold-500 dark:bg-gold-400/10 dark:text-gold-400",
        // Navy - Informational
        navy:
          "border-transparent bg-navy-700/10 text-navy-700 dark:bg-navy-600/20 dark:text-cream-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
