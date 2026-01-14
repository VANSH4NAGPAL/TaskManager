"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Trash2, Clock, CheckCircle2, Circle, Share2, Archive, ArchiveRestore, User, FileText, X } from "lucide-react";
import { Task, TaskStatus } from "@/lib/api";

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
    onEdit: (task: Task) => void;
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
    const [isExpanded, setIsExpanded] = useState(false);

    const status = statusOptions.find(s => s.value === task.status) || statusOptions[0];
    const StatusIcon = task.status === "DONE" ? CheckCircle2 : task.status === "IN_PROGRESS" ? Clock : Circle;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            className="group bg-white rounded-xl border p-4 hover:shadow-sm transition-all"
            style={{ borderColor: "#e5e7eb" }}
        >
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: status.bgColor }}>
                    <StatusIcon className="w-4 h-4" style={{ color: status.color }} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-medium text-gray-900 truncate">{task.title}</h3>
                        {!task.isOwner && task.owner && (
                            <span className="text-xs text-gray-400 shrink-0">from {task.owner.name.split(" ")[0]}</span>
                        )}
                    </div>

                    <div className="mb-2">
                        <p className={`text-sm text-gray-500 whitespace-pre-wrap ${isExpanded ? "" : "line-clamp-1"}`}>
                            {task.description}
                        </p>
                        {task.description.length > 60 && (
                            <button
                                type="button"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-[10px] font-medium text-teal-600 hover:text-teal-700 mt-0.5 hover:underline"
                            >
                                {isExpanded ? "Show Less" : "View More"}
                            </button>
                        )}
                    </div>

                    {task.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                            {task.tags.slice(0, 3).map((t) => (
                                <span key={t} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">{t}</span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canShare(task) && (
                        <button type="button" onClick={() => onShare(task)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-teal-600 transition-colors">
                            <Share2 className="w-4 h-4" />
                        </button>
                    )}
                    {(canEdit(task) && !task.archived) ? (
                        <button type="button" onClick={() => onEdit(task)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                            <Pencil className="w-4 h-4" />
                        </button>
                    ) : (
                        <button type="button" onClick={() => onEdit(task)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors" title="View Details">
                            <FileText className="w-4 h-4" />
                        </button>
                    )}
                    {canEdit(task) && !task.archived && (
                        <button type="button" onClick={() => onArchive(task.id)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-amber-600 transition-colors">
                            <Archive className="w-4 h-4" />
                        </button>
                    )}
                    {task.archived && canEdit(task) && (
                        <button type="button" onClick={() => onUnarchive(task.id)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-emerald-600 transition-colors">
                            <ArchiveRestore className="w-4 h-4" />
                        </button>
                    )}
                    {canDelete(task) && (
                        <button type="button" onClick={() => onDelete(task)} className="p-1.5 rounded-md hover:red-50 text-gray-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
