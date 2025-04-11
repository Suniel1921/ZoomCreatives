import * as React from "react"
import { cn } from "../../lib/utils"


export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background", // Base styles
          "file:border-0 file:bg-transparent file:text-sm file:font-medium", // File input specific styles
          "placeholder:text-muted-foreground", // Placeholder styles
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", // Focus styles
          "disabled:cursor-not-allowed disabled:opacity-50", // Disabled styles
          className // Allow overriding styles via className prop
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }