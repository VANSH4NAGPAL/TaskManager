"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-md border border-[--border] bg-white px-3 text-sm text-[--ink]",
        "placeholder:text-[--muted] focus:border-black focus:ring-1 focus:ring-black outline-none transition",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";
