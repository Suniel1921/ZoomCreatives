import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

// Define variants using class-variance-authority
const alertVariants = cva(
  // Base styles applied to all variants
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        // Default variant styles
        default: "bg-background text-foreground",
        // Destructive variant styles (for errors)
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        // Success variant styles (added custom)
        success:
          "border-green-500/50 text-green-700 dark:border-green-500 [&>svg]:text-green-500", // Example success styling
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// Define the Alert component using React.forwardRef
const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants> // Combine HTML props with variant props
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert" // Accessibility role
    className={cn(alertVariants({ variant }), className)} // Apply variant styles and merge custom classes
    {...props}
  />
))
Alert.displayName = "Alert"

// Define the AlertTitle component
const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)} // Title styling
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

// Define the AlertDescription component
const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)} // Description styling
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }