import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-3 py-2.5 text-base text-gray-900 transition-all outline-none placeholder:text-gray-400 focus-visible:bg-white focus-visible:border-violet-400 focus-visible:ring-4 focus-visible:ring-violet-100 focus-visible:shadow-[0_0_0_4px_rgba(139,92,246,0.08)] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
