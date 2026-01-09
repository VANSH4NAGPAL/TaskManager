import { cn } from "../../lib/cn";
import { ReactNode } from "react";

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-[--border] bg-white px-2 py-1 text-xs font-medium text-[--muted] transition-all duration-200",
        className
      )}
    >
      {children}
    </span>
  );
}
