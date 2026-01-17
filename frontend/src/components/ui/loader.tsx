"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Loader({ size = "md", className = "" }: LoaderProps) {
  const sizeClasses = {
    sm: { dot: "w-1.5 h-1.5", gap: "gap-1" },
    md: { dot: "w-2 h-2", gap: "gap-1.5" },
    lg: { dot: "w-3 h-3", gap: "gap-2" },
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`flex items-center ${sizeClasses[size].gap}`}>
        {[0, 0.15, 0.3].map((delay, i) => (
          <motion.div
            key={i}
            className={`${sizeClasses[size].dot} rounded-full`}
            style={{ backgroundColor: '#0d9488' }}
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function LoaderScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa]">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: '#0d9488' }}
        >
          <span className="text-white font-bold text-sm tracking-tighter">TM</span>
        </div>
        <span className="text-xl font-semibold">TM Dashboard</span>
      </Link>

      {/* Loader */}
      <Loader size="lg" />

      {/* Loading text */}
      <motion.p
        className="mt-4 text-sm text-[--muted]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Loading...
      </motion.p>
    </div>
  );
}
