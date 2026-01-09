"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-lg bg-white border border-[--border] p-6"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 pb-4">
              <h3 className="text-lg font-semibold text-[--ink]">{title}</h3>
              <button 
                onClick={onClose} 
                className="text-[--muted] hover:text-[--ink] text-lg font-medium w-8 h-8 flex items-center justify-center rounded hover:bg-black/5 transition"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

