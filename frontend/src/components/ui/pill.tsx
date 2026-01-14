import { cn } from "../../lib/cn";
import { ReactNode } from "react";

export function Pill({
  children,
  className,
  variant = "default"
}: {
  children: ReactNode;
  className?: string;
  variant?: "default" | "teal";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200",
        variant === "default" && "border border-[--border] bg-gray-50 text-[--muted] hover:bg-gray-100",
        variant === "teal" && "bg-[#0d9488]/10 text-[#0d9488] border border-[#0d9488]/20",
        className
      )}
    >
      {children}
    </span>
  );
}
