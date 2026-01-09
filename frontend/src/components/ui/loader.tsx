import { motion } from "framer-motion";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Loader({ size = "md", className = "" }: LoaderProps) {
  const sizeClasses = {
    sm: { dot: "w-2 h-2", gap: "gap-1.5" },
    md: { dot: "w-3 h-3", gap: "gap-2" },
    lg: { dot: "w-4 h-4", gap: "gap-3" },
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`flex items-center ${sizeClasses[size].gap}`}>
        <motion.div
          className={`${sizeClasses[size].dot} rounded-full bg-black`}
          animate={{ y: [0, -12, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0,
          }}
        />
        <motion.div
          className={`${sizeClasses[size].dot} rounded-full bg-black`}
          animate={{ y: [0, -12, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.15,
          }}
        />
        <motion.div
          className={`${sizeClasses[size].dot} rounded-full bg-black`}
          animate={{ y: [0, -12, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
        />
      </div>
    </div>
  );
}

export function LoaderScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader size="lg" />
    </div>
  );
}
