"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { ButtonHTMLAttributes, forwardRef } from "react";

const buttonStyles = cva(
  "inline-flex items-center justify-center rounded-lg border text-sm font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d9488] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]",
  {
    variants: {
      variant: {
        solid: "bg-[#0d9488] text-white border-[#0d9488] hover:bg-[#0f766e] shadow-sm hover:shadow-md",
        ghost: "bg-transparent border-transparent text-[--ink] hover:bg-black/5",
        outline: "bg-white border-[--border] text-[--ink] hover:border-[#0d9488]/30 hover:bg-[#0d9488]/5",
        danger: "bg-red-600 text-white border-red-600 hover:bg-red-700",
      },
      size: {
        sm: "h-8 px-3 gap-1.5 text-xs rounded-md",
        md: "h-10 px-4 gap-2",
        lg: "h-12 px-6 gap-2 text-base",
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
  VariantProps<typeof buttonStyles> { }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <button ref={ref} className={cn(buttonStyles({ variant, size }), className)} {...props} />;
  }
);
Button.displayName = "Button";
