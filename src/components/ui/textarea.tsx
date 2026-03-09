import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-base text-gray-900 transition-colors outline-none placeholder:text-gray-400 focus-visible:border-violet-400 focus-visible:ring-3 focus-visible:ring-violet-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50 shadow-sm md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
