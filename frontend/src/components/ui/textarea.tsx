"use client";

import { forwardRef, TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-md border border-[--border] bg-white px-3 py-2 text-sm text-[--ink]",
        "placeholder:text-[--muted] focus:border-black focus:ring-1 focus:ring-black outline-none transition",
        className
      )}
      {...props}
    />
  );
});
TextArea.displayName = "TextArea";
