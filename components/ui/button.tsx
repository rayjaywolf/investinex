import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "text-white bg-gradient-to-t from-green-600 to-green-400 shadow-[0_4px_20px_-2px_rgba(20,167,62,0.6)] hover:shadow-[0_4px_25px_0px_rgba(20,167,62,0.7)] active:shadow-[0_4px_15px_-2px_rgba(20,167,62,0.5)] border-none",
        gradientPurple: "text-white bg-gradient-to-t from-purple-600 to-purple-400 shadow-[0_4px_20px_-2px_rgba(147,51,234,0.6)] hover:shadow-[0_4px_25px_0px_rgba(147,51,234,0.7)] active:shadow-[0_4px_15px_-2px_rgba(147,51,234,0.5)] border-none",
        gradientRed: "text-white bg-gradient-to-t from-red-600 to-red-400 shadow-[0_4px_20px_-2px_rgba(220,38,38,0.6)] hover:shadow-[0_4px_25px_0px_rgba(220,38,38,0.7)] active:shadow-[0_4px_15px_-2px_rgba(220,38,38,0.5)] border-none",
        gradientWhite: "text-black bg-gradient-to-t from-gray-50 to-white shadow-[0_4px_20px_-2px_rgba(255,255,255,0.3)] hover:shadow-[0_4px_25px_0px_rgba(255,255,255,0.4)] active:shadow-[0_4px_15px_-2px_rgba(255,255,255,0.25)] border-none",
        gradientBlue: "text-white bg-gradient-to-t from-blue-600 to-blue-400 shadow-[0_4px_20px_-2px_rgba(59,130,246,0.6)] hover:shadow-[0_4px_25px_0px_rgba(59,130,246,0.7)] active:shadow-[0_4px_15px_-2px_rgba(59,130,246,0.5)] border-none",
        gradientGreen: "text-white bg-gradient-to-t from-green-600 to-green-400 shadow-[0_4px_20px_-2px_rgba(20,167,62,0.6)] hover:shadow-[0_4px_25px_0px_rgba(20,167,62,0.7)] active:shadow-[0_4px_15px_-2px_rgba(20,167,62,0.5)] border-none",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
