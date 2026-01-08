import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "active:scale-[0.98]",

          // Variants
          variant === "default" &&
            "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover",
          variant === "secondary" &&
            "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary-hover",
          variant === "outline" &&
            "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground",
          variant === "ghost" &&
            "text-foreground hover:bg-secondary hover:text-secondary-foreground",
          variant === "destructive" &&
            "bg-error text-error-foreground shadow-sm hover:bg-error/90",

          // Sizes
          size === "default" && "h-10 px-5 py-2 text-sm",
          size === "sm" && "h-8 px-3 text-xs",
          size === "lg" && "h-12 px-8 text-base",
          size === "icon" && "h-10 w-10",

          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
