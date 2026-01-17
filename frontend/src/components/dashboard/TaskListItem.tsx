"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2, Clock, CheckCircle2, Circle, Share2, Archive, ArchiveRestore } from "lucide-react";
import { Task, TaskStatus } from "@/lib/api";
import { DeadlineDisplay } from "../ui/UrgencyBadge";

// Status options for color mapping
const statusOptions = [
    { label: "To Do", value: "TODO" as TaskStatus, color: "#9ca3af", bgColor: "#f3f4f6" },
    { label: "In Progress", value: "IN_PROGRESS" as TaskStatus, color: "#d97706", bgColor: "#fffbeb" },
    { label: "Done", value: "DONE" as TaskStatus, color: "#059669", bgColor: "#ecfdf5" },
];

interface TaskListItemProps {
    task: Task;
    index: number;
    canEdit: (task: Task) => boolean;
    canShare: (task: Task) => boolean;
    canDelete: (task: Task) => boolean;
    onEdit: (task: Task) => void; // Now opens view modal
    onShare: (task: Task) => void;
    onArchive: (id: string) => void;
    onUnarchive: (id: string) => void;
    onDelete: (task: Task) => void;
}

export function TaskListItem({
    task,
    index,
    canEdit,
    canShare,
    canDelete,
    onEdit,
    onShare,
    onArchive,
    onUnarchive,
    onDelete
}: TaskListItemProps) {
    const status = statusOptions.find(s => s.value === task.status) || statusOptions[0];
    const StatusIcon = task.status === "DONE" ? CheckCircle2 : task.status === "IN_PROGRESS" ? Clock : Circle;

    // Strip HTML tags for preview
    const plainDescription = task.description?.replace(/<[^>]*>/g, '') || '';

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            className="group bg-white rounded-xl border p-4 hover:shadow-md transition-all cursor-pointer"
            style={{ borderColor: "#e5e7eb" }}
            onClick={() => onEdit(task)} // Click anywhere to open view modal
        >
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: status.bgColor }}>
                    <StatusIcon className="w-4 h-4" style={{ color: status.color }} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">{task.title}</h3>
                        {!task.isOwner && task.owner && (
                            <span className="text-xs text-gray-400 shrink-0">from {task.owner.name.split(" ")[0]}</span>
                        )}
                    </div>

                    {/* Deadline Badge - Only show for timed tasks */}
                    {task.dueDate && task.isTimeBased && (
                        <div className="mb-2">
                            <DeadlineDisplay
                                dueDate={task.dueDate}
                                status={task.status}
                                showTime={true}
                            />
                        </div>
                    )}

                    {plainDescription && (
                        <p className="text-sm text-gray-500 line-clamp-1 mb-2">
                            {plainDescription}
                        </p>
                    )}

                    {/* Tags and Status Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Status Chip */}
                        <span
                            className="px-2 py-0.5 text-xs font-medium rounded"
                            style={{ backgroundColor: status.bgColor, color: status.color }}
                        >
                            {status.label}
                        </span>

                        {/* Tags */}
                        {task.tags.slice(0, 2).map((t) => (
                            <span key={t} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">{t}</span>
                        ))}
                        {task.tags.length > 2 && (
                            <span className="text-xs text-gray-400">+{task.tags.length - 2}</span>
                        )}
                    </div>
                </div>

                {/* Quick Action Buttons */}
                <div
                    className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()} // Prevent triggering view modal
                >
                    {canShare(task) && (
                        <button
                            type="button"
                            onClick={() => onShare(task)}
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-teal-600 transition-colors"
                            title="Share"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>
                    )}
                    {canEdit(task) && !task.archived && (
                        <button
                            type="button"
                            onClick={() => onArchive(task.id)}
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-amber-600 transition-colors"
                            title="Archive"
                        >
                            <Archive className="w-4 h-4" />
                        </button>
                    )}
                    {task.archived && canEdit(task) && (
                        <button
                            type="button"
                            onClick={() => onUnarchive(task.id)}
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-emerald-600 transition-colors"
                            title="Restore"
                        >
                            <ArchiveRestore className="w-4 h-4" />
                        </button>
                    )}
                    {canDelete(task) && (
                        <button
                            type="button"
                            onClick={() => onDelete(task)}
                            className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
