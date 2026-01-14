"use client";

import { forwardRef, TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { }

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-[--border] bg-white px-4 py-3 text-sm text-[--ink]",
        "placeholder:text-[--muted]",
        "focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20 outline-none",
        "transition-all duration-200",
        "hover:border-[--muted]",
        "resize-none",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50",
        className
      )}
      {...props}
    />
  );
});
TextArea.displayName = "TextArea";
