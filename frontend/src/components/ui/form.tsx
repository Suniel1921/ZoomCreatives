"use client" // Add this if using Next.js App Router

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form"

import {Label} from "../../components/ui/label";
import { cn } from "../../lib/utils"

// --- Form Provider ---
// Simply re-exports FormProvider from react-hook-form
const Form = FormProvider

// --- Form Field Context ---
// Used internally to pass field context down
type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

// Hook to access the field context
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  // Get field state using the name from context
  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  // Destructure itemContext to get the id
  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

// --- Form Item Context ---
// Used to generate unique IDs for accessibility attributes
type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

// --- FormField Component ---
// Connects react-hook-form Controller to the UI
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

// --- FormItem Component ---
// Wraps a form field, label, and message, providing context for IDs
const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  // Generate a unique ID for this form item
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

// --- FormLabel Component ---
// Renders a label associated with a form field
const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)} // Apply destructive color if error
      htmlFor={formItemId} // Associate label with the input using its generated ID
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

// --- FormControl Component ---
// Wraps the actual input component (e.g., <Input />, <Select />)
const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId} // ID for the input itself
      aria-describedby={ // Link input to description and error messages for screen readers
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error} // Indicate invalid state if there's an error
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

// --- FormDescription Component ---
// Optional helper text for a form field
const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId} // ID for the description text
      className={cn("text-[0.8rem] text-muted-foreground", className)} // Styling for description
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

// --- FormMessage Component ---
// Displays validation errors for a form field
const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  // Get the error message from the field state, or use the children prop as fallback
  const body = error ? String(error?.message) : children

  if (!body) {
    return null // Don't render anything if there's no error message
  }

  return (
    <p
      ref={ref}
      id={formMessageId} // ID for the error message
      className={cn("text-[0.8rem] font-medium text-destructive", className)} // Styling for error message
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

// --- Export Components ---
export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}