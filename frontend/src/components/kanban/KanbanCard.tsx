"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "../../lib/api";
import { Pencil, Trash2, Clock, CheckCircle2, Circle, Share2, FileText } from "lucide-react";
import { motion } from "framer-motion";

interface KanbanCardProps {
    task: Task;
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => void;
    onShare: (task: Task) => void;
}

export function KanbanCard({ task, onEdit, onDelete, onShare }: KanbanCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const canEdit = task.isOwner || task.myPermission === "EDITOR";
    const canShare = task.isOwner || task.myPermission === "EDITOR" || task.myPermission === "VIEWER";
    const canDelete = task.isOwner;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: {
            type: "Task",
            task,
        },
        disabled: !canEdit,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="bg-white opacity-40 border-2 border-teal-500 rounded-xl h-[120px] shadow-lg cursor-grabbing"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={{
                ...style,
                borderColor: "#e5e7eb"
            }}
            {...attributes}
            {...listeners}
            className={`bg-white p-3 rounded-xl border shadow-sm hover:shadow-md group relative ${!canEdit ? 'cursor-not-allowed opacity-90' : 'cursor-grab active:cursor-grabbing'}`}
        >
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{task.title}</h4>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-white/90 p-1 rounded-md shadow-sm border border-gray-100">
                    {canShare && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onShare(task); }}
                            className="p-1 hover:bg-teal-50 rounded text-gray-400 hover:text-teal-600"
                        >
                            <Share2 className="w-3 h-3" />
                        </button>
                    )}
                    {(canEdit && !task.archived) ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700"
                        >
                            <Pencil className="w-3 h-3" />
                        </button>
                    ) : (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700"
                            title="View Details"
                        >
                            <FileText className="w-3 h-3" />
                        </button>
                    )}
                    {canDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(task); }}
                            className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            <div className="mb-3">
                <p className={`text-xs text-gray-500 whitespace-pre-wrap ${isExpanded ? "" : "line-clamp-2"}`}>
                    {task.description}
                </p>
                {task.description.length > 60 && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                        className="text-[10px] font-medium text-teal-600 hover:text-teal-700 mt-0.5 hover:underline"
                    >
                        {isExpanded ? "Show Less" : "View More"}
                    </button>
                )}
            </div>

            <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-50 text-xs text-gray-500 font-medium">
                    {task.status === "DONE" ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> :
                        task.status === "IN_PROGRESS" ? <Clock className="w-3 h-3 text-amber-500" /> :
                            <Circle className="w-3 h-3 text-gray-400" />}
                    {task.status === "DONE" ? "Done" : task.status === "IN_PROGRESS" ? "In Progress" : "To Do"}
                </div>

                {task.tags && task.tags.length > 0 && (
                    <div className="flex -space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-teal-500 ring-2 ring-white" />
                        {task.tags.length > 1 && <span className="w-2 h-2 rounded-full bg-gray-300 ring-2 ring-white" />}
                    </div>
                )}
            </div>
        </div>
    );
}
