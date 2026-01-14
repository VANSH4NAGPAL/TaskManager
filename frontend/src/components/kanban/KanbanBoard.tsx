"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
    defaultDropAnimationSideEffects,
    DropAnimation,
    MeasuringStrategy,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Task, TaskStatus } from "../../lib/api";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { createPortal } from "react-dom";
import { Loader } from "lucide-react";

interface KanbanBoardProps {
    tasks: Task[];
    onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => void;
    onShare: (task: Task) => void;
    isUpdating?: boolean;
}

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: "0.5",
            },
        },
    }),
};

export function KanbanBoard({ tasks: initialTasks, onStatusChange, onEdit, onDelete, onShare, isUpdating }: KanbanBoardProps) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [activeId, setActiveId] = useState<string | null>(null);

    // Sync state when props change (unless dragging active)
    useEffect(() => {
        if (!activeId) {
            setTasks(initialTasks);
        }
    }, [initialTasks, activeId]);

    const columns: { id: TaskStatus; title: string }[] = [
        { id: "TODO", title: "To Do" },
        { id: "IN_PROGRESS", title: "In Progress" },
        { id: "DONE", title: "Done" },
    ];

    // Group tasks by status
    const tasksByStatus = useMemo(() => {
        const grouped: Record<TaskStatus, Task[]> = {
            TODO: [],
            IN_PROGRESS: [],
            DONE: [],
        };
        tasks.forEach((task) => {
            if (grouped[task.status]) {
                grouped[task.status].push(task);
            }
        });
        return grouped;
    }, [tasks]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Keep activeId in sync
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Find the active task
        const activeTask = tasks.find(t => t.id === activeId);
        if (!activeTask) return;

        // Find over task (or column)
        const overTask = tasks.find(t => t.id === overId);

        // If over a column directly
        const isOverColumn = ["TODO", "IN_PROGRESS", "DONE"].includes(overId);

        // Calculate new status
        let newStatus: TaskStatus | null = null;

        if (isOverColumn) {
            newStatus = overId as TaskStatus;
        } else if (overTask) {
            newStatus = overTask.status;
        }

        // If status is changing, update local state
        if (newStatus && newStatus !== activeTask.status) {
            setTasks(prev => {
                return prev.map(t =>
                    t.id === activeId ? { ...t, status: newStatus as TaskStatus } : t
                );
            });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeTask = tasks.find((t) => t.id === active.id);
        const originalTask = initialTasks.find((t) => t.id === active.id); // Get true original state

        if (!activeTask || !originalTask) return;

        // Even if we updated local state optimistically, we check the final position
        // Dnd-kit's "over" logic at end gives us the final drop target

        const overId = over.id as string;
        const isOverColumn = ["TODO", "IN_PROGRESS", "DONE"].includes(overId);
        let finalStatus = activeTask.status; // Start with current optimistic status

        if (isOverColumn) {
            finalStatus = overId as TaskStatus;
        } else {
            const overTask = tasks.find(t => t.id === overId);
            if (overTask) finalStatus = overTask.status;
        }

        // Only call API if status actually DIFFERENT from SERVER state
        if (finalStatus !== originalTask.status) {
            onStatusChange(activeTask.id, finalStatus);
        } else {
            // Revert local changes if no API call needed (or let useEffect handle it)
            setTasks(initialTasks);
        }
    };

    const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            measuring={{ // Added measuring prop
                droppable: {
                    strategy: MeasuringStrategy.Always,
                },
            }}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <motion.div
                className="flex gap-6 h-full overflow-x-auto pb-4 relative no-scrollbar"
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: {
                            staggerChildren: 0.1
                        }
                    }
                }}
            >
                {columns.map((col) => (
                    <motion.div
                        key={col.id}
                        className="flex-1 min-w-[300px]"
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: {
                                opacity: 1,
                                y: 0,
                                transition: {
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 24
                                }
                            }
                        }}
                    >
                        <KanbanColumn
                            id={col.id}
                            title={col.title}
                            tasks={tasksByStatus[col.id]}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onShare={onShare}
                        />
                    </motion.div>
                ))}
            </motion.div>

            {/* Updating Overlay */}
            {isUpdating && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-50 flex items-center justify-center rounded-xl">
                    <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-100 flex items-center gap-2">
                        <Loader className="w-4 h-4 animate-spin text-teal-600" />
                        <span className="text-sm font-medium text-gray-700">Updating...</span>
                    </div>
                </div>
            )}

            {createPortal(
                <DragOverlay dropAnimation={dropAnimation}>
                    {activeTask ? (
                        <div className="transform rotate-3 cursor-grabbing">
                            <KanbanCard task={activeTask} onEdit={() => { }} onDelete={() => { }} onShare={() => { }} />
                        </div>
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}
