"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { ButtonHTMLAttributes, forwardRef } from "react";

const buttonStyles = cva(
  "inline-flex items-center justify-center rounded-md border text-sm font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        solid: "bg-black text-white border-black hover:bg-black/90",
        ghost: "bg-transparent border-transparent text-black hover:bg-black/5",
        outline: "bg-white border-[--border] text-black hover:bg-black/5",
      },
      size: {
        md: "h-10 px-4 gap-2",
        lg: "h-11 px-5 gap-2",
        sm: "h-8 px-3 gap-1.5 text-xs",
      },
    },
    defaultVariants: {
      variant: "solid",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <button ref={ref} className={cn(buttonStyles({ variant, size }), className)} {...props} />;
  }
);
Button.displayName = "Button";
