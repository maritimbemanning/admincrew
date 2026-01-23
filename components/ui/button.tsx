import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // Primary: Navy on light, Gold on dark
        default:
          "bg-navy-900 text-cream-50 hover:bg-navy-800 dark:bg-gold-500 dark:text-navy-900 dark:hover:bg-gold-400",
        // Gold CTA - for dark backgrounds or emphasis
        gold:
          "bg-gold-500 text-navy-900 hover:bg-gold-400 shadow-sm",
        // Navy CTA - for light backgrounds
        navy:
          "bg-navy-900 text-cream-50 hover:bg-navy-800 shadow-sm",
        // Destructive
        destructive:
          "bg-error text-white hover:bg-error/90 focus-visible:ring-error/20",
        // Outline - premium secondary
        outline:
          "border border-slate-200 bg-transparent text-foreground hover:bg-navy-900 hover:text-cream-50 hover:border-navy-900 dark:border-navy-700 dark:hover:bg-gold-500 dark:hover:text-navy-900 dark:hover:border-gold-500",
        // Secondary - subtle
        secondary:
          "bg-slate-100 text-navy-900 hover:bg-slate-200 dark:bg-navy-800 dark:text-cream-100 dark:hover:bg-navy-700",
        // Ghost - minimal
        ghost:
          "text-foreground hover:bg-slate-100 dark:hover:bg-navy-800",
        // Link
        link: "text-navy-700 underline-offset-4 hover:underline dark:text-gold-400",
        // Success
        success:
          "bg-success text-white hover:bg-success/90",
        // Warning
        warning:
          "bg-warning text-navy-900 hover:bg-warning/90",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md gap-1.5 px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-lg px-10 text-base font-medium",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
