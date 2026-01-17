"use client";

import { Modal } from "../ui/modal";
import { Command, Search, Plus, X, Keyboard, ArrowUp } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface ShortcutsModalProps {
    open: boolean;
    onClose: () => void;
}

interface ShortcutItemProps {
    icon: LucideIcon;
    label: string;
    keys: string[];
}

const shortcuts: ShortcutItemProps[] = [
    { icon: Plus, label: "Create a new task", keys: ["C"] },
    { icon: Search, label: "Search tasks", keys: ["Ctrl", "K"] },
    { icon: Keyboard, label: "Open shortcuts", keys: ["Shift", "?"] },
    { icon: X, label: "Close modal", keys: ["Esc"] },
];

export function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
    return (
        <Modal open={open} title="Keyboard Shortcuts" onClose={onClose} size="sm">
            <div className="space-y-1">
                {/* Header Decoration */}
                <div className="flex items-center gap-3 pb-4 mb-2 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                        <Command className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900">Speed up your workflow</p>
                        <p className="text-xs text-gray-500">Use these shortcuts anywhere in the dashboard</p>
                    </div>
                </div>

                {/* Shortcut List */}
                <div className="space-y-1">
                    {shortcuts.map((shortcut, index) => (
                        <ShortcutItem key={index} {...shortcut} />
                    ))}
                </div>

                {/* Footer */}
                <div className="pt-4 mt-3 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400">
                        Press <kbd className="mx-1 px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-600 font-mono text-[10px]">Esc</kbd> to close
                    </p>
                </div>
            </div>
        </Modal>
    );
}

function ShortcutItem({ icon: Icon, label, keys }: ShortcutItemProps) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all duration-150 group cursor-default">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-teal-50 group-hover:border-teal-100 group-hover:text-teal-600 transition-colors duration-150">
                    <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{label}</span>
            </div>
            <div className="flex items-center gap-1">
                {keys.map((key, i) => (
                    <kbd
                        key={i}
                        className="min-w-[28px] h-7 px-2 flex items-center justify-center text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.05)] group-hover:border-gray-300 group-hover:shadow-[0_2px_4px_rgba(0,0,0,0.08)] transition-all"
                    >
                        {key}
                    </kbd>
                ))}
            </div>
        </div>
    );
}
