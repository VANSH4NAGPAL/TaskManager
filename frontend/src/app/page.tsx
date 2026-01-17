"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Zap,
  Users,
  ArrowRight,
  CheckCircle2,
  Github,
  Twitter,
  Linkedin,
  ChevronDown,
  Download,
  Archive,
} from "lucide-react";

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState<"LIST" | "BOARD">("BOARD");

  const features = [
    {
      icon: Shield,
      title: "Secure",
      description: "JWT authentication with encrypted passwords. Your data is protected.",
    },
    {
      icon: Zap,
      title: "Real-time",
      description: "Live notifications when collaborators make changes to shared tasks.",
    },
    {
      icon: Users,
      title: "Collaborate",
      description: "Share tasks with team members. Control permissions with viewer/editor roles.",
    },
    {
      icon: Download,
      title: "Export",
      description: "Download your tasks as JSON or CSV anytime. Your data belongs to you.",
    },
    {
      icon: Archive,
      title: "Organize",
      description: "Archive completed tasks to keep your workspace clean and focused.",
    },
  ];

  const faqs = [
    {
      q: "Is TM Dashboard free?",
      a: "Yes! TM Dashboard is completely free to use with all features included.",
    },
    {
      q: "How secure is my data?",
      a: "We use JWT authentication with bcrypt-encrypted passwords and secure HTTPS connections. Your data is stored safely and never shared.",
    },
    {
      q: "Can I collaborate with my team?",
      a: "Yes! Share any task with team members by email. You can set them as Viewer (read-only) or Editor (can modify). You'll get notified when they make changes.",
    },
    {
      q: "Can I export my data?",
      a: "Absolutely. Export all your tasks as JSON or CSV with one click. Your data is yours.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-dots" style={{ backgroundColor: "#fafafa" }}>
      {/* Header */}
      <header className="relative z-20 flex items-center justify-between w-full max-w-5xl mx-auto px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#0d9488" }}>
            <span className="text-white font-semibold text-[10px] tracking-tighter">TM</span>
          </div>
          <span className="font-medium text-gray-900">TM Dashboard</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          <Link href="#features" className="hover:text-gray-900 transition-colors">Features</Link>
          <Link href="#faq" className="hover:text-gray-900 transition-colors">FAQ</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-gray-600">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-20">
        <motion.div
          className="text-center max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block px-3 py-1 text-sm font-medium rounded-full mb-6" style={{ backgroundColor: "#f0fdfa", color: "#0d9488" }}>
            Simple task management
          </span>
          <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 leading-tight mb-4">
            Organize your work, <br />simply.
          </h1>
          <p className="text-lg text-gray-500 mb-8 max-w-lg mx-auto">
            A minimal, focused task manager. Create tasks, collaborate with your team, and stay organized.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg">
                Start for free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">Log in</Button>
            </Link>
          </div>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          className="mt-16 max-w-4xl w-full mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="bg-white rounded-xl border shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-1" style={{ borderColor: "#e5e7eb" }}>
            {/* Browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-300" />
                <div className="w-3 h-3 rounded-full bg-gray-300" />
                <div className="w-3 h-3 rounded-full bg-gray-300" />
              </div>
              <div className="flex-1 text-center text-xs text-gray-400">tmdashboard.app/dashboard</div>
            </div>
            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xl font-semibold text-gray-900">12</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xl font-semibold text-gray-500">4</p>
                  <p className="text-xs text-gray-500">To do</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xl font-semibold" style={{ color: "#f59e0b" }}>5</p>
                  <p className="text-xs text-gray-500">In progress</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xl font-semibold" style={{ color: "#10b981" }}>3</p>
                  <p className="text-xs text-gray-500">Done</p>
                </div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Your Tasks</h3>
                <div className="flex p-0.5 rounded-lg bg-gray-100/80 border border-gray-200/60">
                  <button
                    onClick={() => setPreviewMode("LIST")}
                    className={`px-2 py-0.5 rounded-md text-xs font-medium transition-all ${previewMode === "LIST" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                  >
                    List
                  </button>
                  <button
                    onClick={() => setPreviewMode("BOARD")}
                    className={`px-2 py-0.5 rounded-md text-xs font-medium transition-all ${previewMode === "BOARD" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                  >
                    Board
                  </button>
                </div>
              </div>

              {previewMode === "BOARD" ? (
                <div className="grid grid-cols-3 gap-3">
                  {/* To Do Column */}
                  <div className="bg-gray-50/50 rounded-lg p-2 border border-dashed border-gray-200 hover:bg-gray-100/50 transition-colors">
                    <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2 px-1">To do</div>
                    <div className="bg-white p-2.5 rounded-lg border shadow-sm border-gray-100 hover:shadow-md hover:scale-[1.02] transition-all cursor-default">
                      <span className="text-xs text-gray-700 font-medium block mb-1">Design homepage</span>
                      <span className="text-[10px] text-gray-400">Draft layout and copy</span>
                    </div>
                  </div>

                  {/* In Progress Column */}
                  <div className="bg-amber-50/30 rounded-lg p-2 border border-dashed border-amber-100 hover:bg-amber-50/50 transition-colors">
                    <div className="text-[10px] font-medium text-amber-500 uppercase tracking-wider mb-2 px-1">In Progress</div>
                    <div className="bg-white p-2.5 rounded-lg border shadow-sm border-gray-100 hover:shadow-md hover:scale-[1.02] transition-all cursor-default">
                      <span className="text-xs text-gray-700 font-medium block mb-1">Write API docs</span>
                      <div className="flex items-center gap-1 mt-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-[9px] font-medium">backend</span>
                      </div>
                    </div>
                  </div>

                  {/* Done Column */}
                  <div className="bg-emerald-50/30 rounded-lg p-2 border border-dashed border-emerald-100 hover:bg-emerald-50/50 transition-colors">
                    <div className="text-[10px] font-medium text-emerald-500 uppercase tracking-wider mb-2 px-1">Done</div>
                    <div className="bg-white p-2.5 rounded-lg border shadow-sm border-gray-100 opacity-75 hover:opacity-100 hover:shadow-md hover:scale-[1.02] transition-all cursor-default">
                      <span className="text-xs text-gray-700 font-medium block mb-1 line-through text-gray-400">Fix login bug</span>
                      <div className="flex items-center gap-1 mt-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span className="text-[9px] text-emerald-600 font-medium">Completed</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {["Design homepage", "Write API docs", "Fix login bug"].map((task, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border hover:border-teal-200 hover:bg-teal-50/30 hover:shadow-sm transition-all cursor-default" style={{ borderColor: "#e5e7eb" }}>
                      <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: i === 2 ? "#d1fae5" : i === 1 ? "#fef3c7" : "#f3f4f6" }}>
                        <CheckCircle2 className="w-3.5 h-3.5" style={{ color: i === 2 ? "#10b981" : i === 1 ? "#f59e0b" : "#6b7280" }} />
                      </div>
                      <span className="text-sm text-gray-700">{task}</span>
                      {i === 1 && <span className="ml-auto px-2 py-0.5 rounded bg-amber-50 text-amber-600 text-[10px] font-medium">backend</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-white border-y" style={{ borderColor: "#e5e7eb" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Everything you need</h2>
            <p className="text-gray-500">Simple features that help you stay organized.</p>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                className="text-center p-4 rounded-2xl hover:bg-gray-50 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "#f0fdfa" }}>
                  <feature.icon className="w-5 h-5" style={{ color: "#0d9488" }} />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Questions & Answers</h2>
            <p className="text-gray-500">Common questions about TM Dashboard.</p>
          </div>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow duration-300" style={{ borderColor: "#e5e7eb" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="font-medium text-gray-900">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="px-4 pb-4 text-gray-600">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-white border-t" style={{ borderColor: "#e5e7eb" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Ready to get organized?</h2>
          <p className="text-gray-500 mb-6">Start managing your tasks today. It's free.</p>
          <Link href="/signup">
            <Button size="lg">
              Get Started
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6" style={{ borderColor: "#e5e7eb" }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#0d9488" }}>
              <span className="text-white font-semibold text-[8px] tracking-tighter">TM</span>
            </div>
            <span className="text-sm font-medium text-gray-700">TM Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
          <p className="text-sm text-gray-500">
            Made by <span className="text-gray-700 font-medium">Vansh Nagpal</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
