import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground h-10 w-full min-w-0 rounded-lg border border-border bg-background px-4 py-2 text-base shadow-sm transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-gold-500 focus-visible:ring-2 focus-visible:ring-gold-500/20",
        "dark:bg-navy-800/50 dark:border-navy-700 dark:focus-visible:border-gold-400 dark:focus-visible:ring-gold-400/20",
        "aria-invalid:ring-error/20 aria-invalid:border-error",
        className
      )}
      {...props}
    />
  )
}

export { Input }
