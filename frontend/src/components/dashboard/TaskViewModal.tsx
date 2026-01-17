"use client";

import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { Task } from "@/lib/api";
import { UrgencyBadge, getUrgencyConfig } from "../ui/UrgencyBadge";
import {
    Pencil,
    Trash2,
    Undo2,
    Share2,
    Calendar,
    Clock,
    Tag,
    User,
    CheckCircle2,
    Circle,
    Timer,
    Bell,
    Repeat
} from "lucide-react";
import { format } from "date-fns";

interface TaskViewModalProps {
    open: boolean;
    task: Task | null;
    onClose: () => void;
    onEdit: () => void;
    onShare: () => void;
    onDelete: () => void;
    onRestore?: () => void;
    onPermanentDelete?: () => void;
    canEdit: boolean;
    canShare: boolean;
    canDelete: boolean;
}

const statusConfig = {
    TODO: { label: "To Do", color: "#6b7280", bgColor: "#f3f4f6", icon: Circle },
    IN_PROGRESS: { label: "In Progress", color: "#f59e0b", bgColor: "#fef3c7", icon: Timer },
    DONE: { label: "Done", color: "#10b981", bgColor: "#d1fae5", icon: CheckCircle2 },
};

export function TaskViewModal({
    open,
    task,
    onClose,
    onEdit,
    onShare,
    onDelete,
    onRestore,
    onPermanentDelete,
    canEdit,
    canShare,
    canDelete
}: TaskViewModalProps) {
    if (!task) return null;

    const isTrashed = !!task.deletedAt;
    const status = statusConfig[task.status] || statusConfig.TODO;
    const StatusIcon = status.icon;
    const urgencyConfig = task.dueDate ? getUrgencyConfig(task.dueDate, task.status) : null;

    // Parse reminders if present
    const reminders = Array.isArray(task.reminders) ? task.reminders : [];
    const hasReminders = reminders.length > 0 && reminders[0];

    return (
        <Modal open={open} onClose={onClose} title="" size="lg">
            <div className="space-y-6">
                {/* Header with Title and Status */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <h2 className={`text-2xl font-bold ${isTrashed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{task.title}</h2>
                        {isTrashed && (
                            <div className="flex items-center gap-2 mt-2 text-red-600 bg-red-50 px-3 py-1 rounded-full w-fit">
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">This task is in the trash</span>
                            </div>
                        )}
                        {!isTrashed && !task.isOwner && task.owner && (
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                <User className="w-3.5 h-3.5" />
                                Shared by {task.owner.name}
                            </p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        {isTrashed ? (
                            <>
                                {onRestore && (
                                    <Button variant="outline" size="sm" onClick={onRestore} className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 border-teal-200">
                                        <Undo2 className="w-4 h-4 mr-1.5" />
                                        Restore
                                    </Button>
                                )}
                                {onPermanentDelete && (
                                    <Button variant="danger" size="sm" onClick={onPermanentDelete}>
                                        <Trash2 className="w-4 h-4 mr-1.5" />
                                        Delete Forever
                                    </Button>
                                )}
                            </>
                        ) : (
                            <>
                                {canShare && (
                                    <Button variant="outline" size="sm" onClick={onShare}>
                                        <Share2 className="w-4 h-4 mr-1.5" />
                                        Share
                                    </Button>
                                )}
                                {canEdit && (
                                    <Button variant="outline" size="sm" onClick={onEdit}>
                                        <Pencil className="w-4 h-4 mr-1.5" />
                                        Edit
                                    </Button>
                                )}
                                {canDelete && (
                                    <Button variant="danger" size="sm" onClick={onDelete}>
                                        <Trash2 className="w-4 h-4 mr-1.5" />
                                        Delete
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Status & Urgency Badges */}
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Status Badge */}
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
                        style={{ backgroundColor: status.bgColor, color: status.color }}
                    >
                        <StatusIcon className="w-4 h-4" />
                        {status.label}
                    </div>

                    {/* Urgency Badge (for timed tasks) */}
                    {task.dueDate && task.isTimeBased && (
                        <UrgencyBadge dueDate={task.dueDate} status={task.status} size="md" />
                    )}

                    {/* Tags */}
                    {task.tags.map((tag) => (
                        <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm"
                        >
                            <Tag className="w-3 h-3" />
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Due Date Section */}
                {task.dueDate && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{
                                        backgroundColor: urgencyConfig?.bgColor || "#f3f4f6",
                                        color: urgencyConfig?.color || "#6b7280"
                                    }}
                                >
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {format(new Date(task.dueDate), "EEEE, MMMM d, yyyy")}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        at {format(new Date(task.dueDate), "h:mm a")}
                                    </p>
                                </div>
                            </div>

                            {/* Reminder Info */}
                            {hasReminders && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Bell className="w-4 h-4" />
                                    <span>Reminder set</span>
                                    {(reminders[0] as any)?.repeat && (
                                        <span className="flex items-center gap-1">
                                            <Repeat className="w-3.5 h-3.5" />
                                            Repeating
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Description */}
                {task.description && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Description</h3>
                        <div
                            className="prose prose-sm max-w-none text-gray-700 bg-white border border-gray-200 rounded-xl p-4"
                            dangerouslySetInnerHTML={{ __html: task.description }}
                        />
                    </div>
                )}

                {/* Empty Description State */}
                {!task.description && (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-400 text-sm">No description added</p>
                        {canEdit && (
                            <button
                                onClick={onEdit}
                                className="text-teal-600 hover:text-teal-700 text-sm font-medium mt-1"
                            >
                                Add description
                            </button>
                        )}
                    </div>
                )}

                {/* Progress Indicator for Timed Tasks */}
                {task.dueDate && task.isTimeBased && task.status !== "DONE" && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Time Progress</span>
                            <span
                                className="font-medium"
                                style={{ color: urgencyConfig?.color }}
                            >
                                {urgencyConfig?.label}
                            </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all"
                                style={{
                                    backgroundColor: urgencyConfig?.color,
                                    width: getProgressWidth(task.dueDate, task.createdAt)
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Metadata Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs text-gray-400">
                    <span>Created {format(new Date(task.createdAt), "MMM d, yyyy")}</span>
                    <span>Last updated {format(new Date(task.updatedAt), "MMM d, yyyy 'at' h:mm a")}</span>
                </div>
            </div>
        </Modal>
    );
}

// Calculate progress bar width based on time elapsed
function getProgressWidth(dueDate: string | Date, createdAt: string | Date): string {
    const now = new Date();
    const due = new Date(dueDate);
    const created = new Date(createdAt);

    const total = due.getTime() - created.getTime();
    const elapsed = now.getTime() - created.getTime();

    if (total <= 0) return "100%";

    const percentage = Math.min(100, Math.max(0, (elapsed / total) * 100));
    return `${percentage}%`;
}
