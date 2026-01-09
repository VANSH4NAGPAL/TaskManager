"use client";

import Link from "next/link";
import { Button } from "../components/ui/button";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Animated curved line in background */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <motion.path
          d="M -100 400 Q 200 100, 600 350 T 1300 400 Q 1000 100, 800 450 Q 600 600, 700 900"
          stroke="currentColor"
          strokeWidth="80"
          fill="none"
          className="text-[--ink]"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 3, delay: 1, ease: "easeInOut" }}
        />
      </svg>

      {/* Header */}
      <motion.header
        className="flex items-center justify-between w-full max-w-6xl mx-auto px-6 py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-lg font-medium">PrimeDashboard</div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="md">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="solid" size="md">
              Sign up
            </Button>
          </Link>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-6 pt-32 pb-20 text-center max-w-4xl mx-auto">
        <div className="mb-8">
          <motion.h1
            className="text-6xl md:text-7xl font-light text-[--ink] tracking-tight leading-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <motion.span
              className="inline-block"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            >
              Organize your work,
            </motion.span>
            <br />
            <motion.span
              className="inline-block"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
            >
              simply
            </motion.span>
          </motion.h1>
        </div>

        <motion.p
          className="text-lg text-[--muted] mb-12 max-w-xl leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          A minimal task management dashboard with secure authentication
        </motion.p>

        <motion.div
          className="flex gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link href="/signup">
            <Button variant="solid" size="lg">
              Get started
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">
              Sign in
            </Button>
          </Link>
        </motion.div>

        {/* Connected feature flow */}
        <div className="relative w-full mt-32">
          {/* Feature cards */}
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-16">
            <motion.div
              className="text-center flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              {/* Node circle */}
              <motion.div
                className="w-3 h-3 bg-[--ink] rounded-full mb-8"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: 0.8 }}
              />
              
              <motion.h3
                className="font-medium text-2xl mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
              >
                Secure
              </motion.h3>
              <motion.p
                className="text-sm text-[--muted] leading-relaxed max-w-[200px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.1 }}
              >
                JWT authentication with encrypted passwords
              </motion.p>
            </motion.div>

            <motion.div
              className="text-center flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              {/* Node circle */}
              <motion.div
                className="w-3 h-3 bg-[--ink] rounded-full mb-8"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: 1.2 }}
              />
              
              <motion.h3
                className="font-medium text-2xl mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.4 }}
              >
                Fast
              </motion.h3>
              <motion.p
                className="text-sm text-[--muted] leading-relaxed max-w-[200px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.5 }}
              >
                Real-time updates and instant search
              </motion.p>
            </motion.div>

            <motion.div
              className="text-center flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              {/* Node circle */}
              <motion.div
                className="w-3 h-3 bg-[--ink] rounded-full mb-8"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: 1.6 }}
              />
              
              <motion.h3
                className="font-medium text-2xl mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.8 }}
              >
                Simple
              </motion.h3>
              <motion.p
                className="text-sm text-[--muted] leading-relaxed max-w-[200px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.9 }}
              >
                Clean interface, no clutter
              </motion.p>
            </motion.div>
          </div>

          {/* Animated connecting line - positioned behind nodes */}
          <svg
            className="absolute top-0 left-0 w-full h-8 pointer-events-none hidden md:block"
            viewBox="0 0 100 10"
            preserveAspectRatio="xMidYMid meet"
          >
            <motion.line
              x1="16.666"
              y1="5"
              x2="83.333"
              y2="5"
              stroke="currentColor"
              strokeWidth="0.3"
              className="text-[--border]"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
              strokeDasharray="1"
              strokeDashoffset="0"
            />
          </svg>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-8 text-center">
        <p className="text-sm text-[--muted]">
          Made by <span className="text-[--ink] font-medium">Vansh Nagpal</span>
        </p>
      </footer>
    </div>
  );
}
