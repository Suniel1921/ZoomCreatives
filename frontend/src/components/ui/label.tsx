"use client" // Add this if using Next.js App Router

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"



// Define label variants using class-variance-authority
const labelVariants = cva(
  // Base styles for the label
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

// Define the Label component using React.forwardRef
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>, // Type for the element ref (HTML label element)
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & // Inherit props from Radix Label
    VariantProps<typeof labelVariants> // Add variant props from cva
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref} // Forward the ref to the Radix component
    className={cn(labelVariants(), className)} // Apply variant styles and merge custom classes
    {...props} // Pass down all other props
  />
))
Label.displayName = LabelPrimitive.Root.displayName // Set display name for debugging

export { Label } // Export the component