import { ReactNode } from "react";
import { cn } from "../../lib/cn";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "bg-white border border-[--border] rounded-xl p-5",
        "transition-all duration-300",
        "shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}
