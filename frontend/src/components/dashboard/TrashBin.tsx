import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTrashedTasks, emptyTrash, restoreTask, permanentDeleteTask, Task } from "@/lib/api";
import { Trash2, Undo2, Loader, AlertTriangle, X } from "lucide-react";
import { Button } from "../ui/button";
import { Modal } from "../ui/modal";
import { CountdownButton } from "../ui/CountdownButton";

interface TrashBinProps {
    onView?: (task: Task) => void;
}

export function TrashBin({ onView }: TrashBinProps) {
    const queryClient = useQueryClient();
    const [confirmEmpty, setConfirmEmpty] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ["trash"],
        queryFn: getTrashedTasks,
        // Refetch often or when window focuses to keep sync
        staleTime: 1000 * 60,
    });

    const emptyMutation = useMutation({
        mutationFn: emptyTrash,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["trash"] });
            setConfirmEmpty(false);
        }
    });

    const restoreMutation = useMutation({
        mutationFn: restoreTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["trash"] });
            queryClient.invalidateQueries({ queryKey: ["tasks"] }); // Refresh main lists
        }
    });

    const deleteMutation = useMutation({
        mutationFn: permanentDeleteTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["trash"] });
            setTaskToDelete(null);
        }
    });

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-500" />
                    Deleted Tasks
                </h3>
                {tasks.length > 0 && (
                    <button
                        onClick={() => setConfirmEmpty(true)}
                        className="text-xs text-red-600 hover:text-red-700 hover:underline font-medium"
                    >
                        Empty Trash
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {isLoading ? (
                    <div className="text-center py-4">
                        <Loader className="w-4 h-4 animate-spin mx-auto text-gray-400" />
                    </div>
                ) : tasks.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-2">Trash is empty</p>
                ) : (
                    <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                        {/* We can limit the list or show all with scroll. 
                            Users requested "stay there for 7 days". 
                            We should show a message about 7-day retention. */}
                        <p className="text-[10px] text-gray-400 text-center pb-2 border-b border-gray-50 mb-2">
                            Items are permanently deleted after 7 days
                        </p>

                        {tasks.map(task => (
                            <div key={task.id} className="p-3 rounded-lg bg-red-50 border border-red-100 group transition-all hover:bg-white hover:shadow-sm hover:border-red-200">
                                <div className="flex items-start justify-between gap-2 mb-1 cursor-pointer" onClick={() => onView?.(task)}>
                                    <p className="text-sm font-medium text-gray-700 truncate flex-1 line-through decoration-gray-400 decoration-2 hover:text-red-700 transition-colors">{task.title}</p>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-[10px] text-gray-400">
                                        Deleted {new Date(task.deletedAt!).toLocaleDateString()}
                                    </span>
                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => restoreMutation.mutate(task.id)}
                                            disabled={restoreMutation.isPending}
                                            className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                                            title="Restore"
                                        >
                                            {restoreMutation.isPending && restoreMutation.variables === task.id ? (
                                                <Loader className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Undo2 className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setTaskToDelete(task)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                            title="Delete Forever"
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

            {/* Empty Trash Confirmation */}
            <Modal open={confirmEmpty} title="Empty Trash" onClose={() => setConfirmEmpty(false)} size="sm">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-medium">This will permanently delete all {tasks.length} items in the trash.</p>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setConfirmEmpty(false)}>Cancel</Button>
                        <CountdownButton
                            text="Empty Trash"
                            variant="danger"
                            onComplete={() => emptyMutation.mutate()}
                            disabled={emptyMutation.isPending}
                            className="w-32"
                        />
                    </div>
                </div>
            </Modal>

            {/* Permanent Delete Single Item Confirmation */}
            <Modal open={!!taskToDelete} title="Delete Forever" onClose={() => setTaskToDelete(null)} size="sm">
                <div className="space-y-4">
                    <p className="text-gray-600">Permanently delete <b>{taskToDelete?.title}</b>? This cannot be undone.</p>
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setTaskToDelete(null)}>Cancel</Button>
                        <Button
                            variant="danger"
                            onClick={() => taskToDelete && deleteMutation.mutate(taskToDelete.id)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? "Deleting..." : "Delete Forever"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
