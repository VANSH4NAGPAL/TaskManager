import { ReactNode } from "react";
import { cn } from "../../lib/cn";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("bg-white border border-[--border] rounded-lg p-4 transition-all duration-200", className)}>{children}</div>;
}
