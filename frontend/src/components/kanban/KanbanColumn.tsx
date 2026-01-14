"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Task, TaskStatus } from "../../lib/api";
import { KanbanCard } from "./KanbanCard";
import { motion, AnimatePresence } from "framer-motion";

interface KanbanColumnProps {
    id: TaskStatus;
    title: string;
    tasks: Task[];
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => void;
    onShare: (task: Task) => void;
}

export function KanbanColumn({ id, title, tasks, onEdit, onDelete, onShare }: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({
        id: id,
        data: {
            type: "Column",
            status: id,
        },
    });

    const getStatusColor = (status: TaskStatus) => {
        switch (status) {
            case "TODO": return "bg-gray-100 text-gray-700";
            case "IN_PROGRESS": return "bg-amber-50 text-amber-700";
            case "DONE": return "bg-emerald-50 text-emerald-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/80 rounded-2xl p-4 border border-gray-200/50 min-w-[280px]">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(id)}`}>
                        {tasks.length}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
                </div>
            </div>

            <div ref={setNodeRef} className="flex-1 overflow-y-auto space-y-3 min-h-[200px] no-scrollbar">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    <AnimatePresence mode="popLayout">
                        {tasks.map((task) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                            >
                                <KanbanCard task={task} onEdit={onEdit} onDelete={onDelete} onShare={onShare} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </SortableContext>

                {tasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                        <p className="text-xs text-center text-gray-400 font-medium">No tasks yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
