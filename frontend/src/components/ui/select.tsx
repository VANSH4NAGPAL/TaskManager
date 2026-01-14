"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

interface SelectOption {
    value: string;
    label: string;
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    disabled?: boolean;
    size?: "sm" | "md";
}

export function CustomSelect({ value, onChange, options, disabled, size = "md" }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
    };

    const sizeClasses = size === "sm"
        ? "px-2.5 py-1.5 text-xs"
        : "px-3 py-2 text-sm";

    return (
        <div className="relative" ref={selectRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
          flex items-center justify-between gap-2 
          ${sizeClasses}
          font-medium border rounded-lg bg-white 
          cursor-pointer transition-all
          hover:bg-gray-50 
          focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isOpen ? "ring-2 ring-teal-500/20 border-teal-500" : ""}
        `}
                style={{ borderColor: isOpen ? "#0d9488" : "#e5e7eb", minWidth: size === "sm" ? "90px" : "110px" }}
            >
                <span>{selectedOption?.label || "Select"}</span>
                <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute right-0 mt-1.5 w-full min-w-[100px] bg-white rounded-lg border shadow-lg overflow-hidden z-50"
                        style={{ borderColor: "#e5e7eb" }}
                    >
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option.value)}
                                className={`
                  w-full flex items-center justify-between gap-2
                  px-3 py-2 text-left transition-colors
                  ${size === "sm" ? "text-xs" : "text-sm"}
                  ${value === option.value
                                        ? "bg-teal-50 text-teal-700 font-medium"
                                        : "text-gray-700 hover:bg-gray-50"
                                    }
                `}
                            >
                                <span>{option.label}</span>
                                {value === option.value && (
                                    <Check className="w-3.5 h-3.5 text-teal-600" />
                                )}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
