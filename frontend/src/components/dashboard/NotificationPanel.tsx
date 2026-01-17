"use client";

import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { Bell, CheckCircle2, Clock, Info, User, X, Search, Check, Trash2, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Notification } from "@/lib/api";
import { Button } from "../ui/button";
import { CountdownButton } from "../ui/CountdownButton";

interface NotificationPanelProps {
    notifications: Notification[];
    onMarkRead: (id: string, e: React.MouseEvent) => void;
    onDismiss: (id: string, e: React.MouseEvent) => void;
    onClearAll: (e: React.MouseEvent) => void;
    onItemClick: (n: Notification) => void;
    clearConfirmOpen: boolean;
    setClearConfirmOpen: (open: boolean) => void;
    isClearing: boolean;
}

export function NotificationPanel({
    notifications,
    onMarkRead,
    onDismiss,
    onClearAll,
    onItemClick,
    clearConfirmOpen,
    setClearConfirmOpen,
    isClearing
}: NotificationPanelProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

    // Debounce search query (300ms delay)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Filter Logic
    const filteredNotifications = useMemo(() => {
        let filtered = notifications;

        // 1. Tab filtering
        if (activeTab === "unread") {
            filtered = filtered.filter(n => !n.read);
        }

        // 2. Search filtering (using debounced value)
        if (debouncedSearchQuery.trim()) {
            const q = debouncedSearchQuery.toLowerCase();
            filtered = filtered.filter(n =>
                n.taskTitle.toLowerCase().includes(q) ||
                n.message.toLowerCase().includes(q) ||
                n.actorName.toLowerCase().includes(q)
            );
        }

        return filtered;
    }, [notifications, activeTab, debouncedSearchQuery]);

    const getIcon = (type: string) => {
        switch (type) {
            case "TASK_COMPLETED": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case "DEADLINE_APPROACHING": return <Clock className="w-4 h-4 text-amber-500" />;
            case "TASK_ASSIGNED": return <User className="w-4 h-4 text-blue-500" />;
            case "INVITE_RECEIVED": return <Mail className="w-4 h-4 text-violet-500" />;
            default: return <Info className="w-4 h-4 text-gray-400" />;
        }
    };

    const dropdownVariants = {
        hidden: { opacity: 0, y: -10, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -10, scale: 0.95 }
    };

    return (
        <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute right-0 mt-2 w-96 bg-white rounded-xl border shadow-xl overflow-hidden z-50 flex flex-col max-h-[600px]"
            style={{ borderColor: "#e5e7eb" }}
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    <div className="flex items-center gap-2">
                        {notifications.length > 0 && (
                            <>
                                {clearConfirmOpen ? (
                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
                                        <span className="text-xs text-red-600 font-medium whitespace-nowrap">Are you sure?</span>
                                        <CountdownButton
                                            text="Yes"
                                            variant="danger"
                                            size="sm"
                                            className="h-7 text-xs px-2"
                                            onComplete={() => onClearAll({} as React.MouseEvent)}
                                            disabled={isClearing}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => { e.stopPropagation(); setClearConfirmOpen(false); }}
                                            className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setClearConfirmOpen(true); }}
                                        className="text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Clear All
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-3">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search notifications..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-gray-50 rounded-lg">
                    <button
                        onClick={() => setActiveTab("all")}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === "all"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setActiveTab("unread")}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === "unread"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Unread
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-[400px]">
                {filteredNotifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                        <Bell className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-sm">No notifications found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filteredNotifications.map((n) => (
                            <div
                                key={n.id}
                                onClick={() => onItemClick(n)}
                                className={`group relative p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!n.read ? "bg-teal-50/30" : ""
                                    }`}
                            >
                                <div className="flex gap-3">
                                    <div className="mt-0.5 flex-shrink-0">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!n.read ? "bg-white shadow-sm ring-1 ring-gray-100" : "bg-gray-100"}`}>
                                            {getIcon(n.type)}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900 leading-tight mb-1">
                                            <span className="font-semibold">{n.taskTitle}</span>
                                        </p>
                                        <p className="text-xs text-gray-600 line-clamp-2 mb-1.5">
                                            {n.message}
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-medium">
                                            {format(new Date(n.createdAt), "MMM d, h:mm a")}
                                        </p>
                                    </div>

                                    {/* Unread Indicator */}
                                    {!n.read && (
                                        <div className="absolute top-4 right-4 w-2 h-2 bg-teal-500 rounded-full ring-4 ring-teal-500/10" />
                                    )}

                                    {/* Action Buttons (visible on hover) */}
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm p-1 rounded-lg">
                                        {!n.read && (
                                            <button
                                                onClick={(e) => onMarkRead(n.id, e)}
                                                className="p-1.5 hover:bg-gray-100 rounded-md text-teal-600 transition-colors"
                                                title="Mark as read"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => onDismiss(n.id, e)}
                                            className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-md transition-colors"
                                            title="Dismiss"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
