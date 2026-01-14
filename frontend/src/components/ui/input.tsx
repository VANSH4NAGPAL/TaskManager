"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> { }

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-lg border border-[--border] bg-white px-4 text-sm text-[--ink]",
        "placeholder:text-[--muted]",
        "focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20 outline-none",
        "transition-all duration-200",
        "hover:border-[--muted]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";
