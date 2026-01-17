"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
                    style={{ backgroundColor: '#0d9488' }}
                />
                <div
                    className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-10"
                    style={{ backgroundColor: '#0d9488' }}
                />
            </div>

            {/* Content */}
            <motion.div
                className="relative z-10 text-center max-w-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                {/* Logo */}
                <Link href="/" className="inline-flex items-center gap-2 mb-12">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: '#0d9488' }}
                    >
                        <span className="text-white font-bold text-sm tracking-tighter">TM</span>
                    </div>
                    <span className="text-xl font-semibold">TM Dashboard</span>
                </Link>

                {/* 404 */}
                <motion.div
                    className="mb-8"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <h1
                        className="text-[150px] font-bold leading-none tracking-tighter"
                        style={{ color: '#0d9488' }}
                    >
                        404
                    </h1>
                </motion.div>

                {/* Message */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <h2 className="text-2xl font-semibold text-[--ink] mb-4">
                        Page not found
                    </h2>
                    <p className="text-[--muted] mb-8 leading-relaxed">
                        Oops! The page you're looking for doesn't exist or has been moved.
                        Let's get you back on track.
                    </p>
                </motion.div>

                {/* Actions */}
                <motion.div
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Link href="/">
                        <Button
                            size="lg"
                            className="w-full sm:w-auto text-white"
                            style={{ backgroundColor: '#0d9488' }}
                        >
                            <Home className="w-4 h-4 mr-2" />
                            Go home
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => window.history.back()}
                        className="w-full sm:w-auto"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go back
                    </Button>
                </motion.div>

                {/* Helpful links */}
                <motion.div
                    className="mt-12 pt-8 border-t border-[--border]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <p className="text-sm text-[--muted] mb-4">Or try these helpful links:</p>
                    <div className="flex flex-wrap gap-4 justify-center text-sm">
                        <Link
                            href="/login"
                            className="hover:underline"
                            style={{ color: '#0d9488' }}
                        >
                            Login
                        </Link>
                        <Link
                            href="/signup"
                            className="hover:underline"
                            style={{ color: '#0d9488' }}
                        >
                            Sign up
                        </Link>
                        <Link
                            href="/#features"
                            className="hover:underline"
                            style={{ color: '#0d9488' }}
                        >
                            Features
                        </Link>
                        <Link
                            href="/#pricing"
                            className="hover:underline"
                            style={{ color: '#0d9488' }}
                        >
                            Pricing
                        </Link>
                    </div>
                </motion.div>
            </motion.div>

            {/* Footer */}
            <motion.footer
                className="absolute bottom-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
            >
                <p className="text-sm text-[--muted]">
                    © 2026 TM Dashboard. Made by <span className="font-medium text-[--ink]">Vansh Nagpal</span>
                </p>
            </motion.footer>
        </div>
    );
}
