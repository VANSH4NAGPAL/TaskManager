"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrentUser, useLogout } from "../../hooks/useAuth";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { TextArea } from "../../components/ui/textarea";
import { Pill } from "../../components/ui/pill";
import { Modal } from "../../components/ui/modal";
import { LoaderScreen } from "../../components/ui/loader";
import { Task, TaskStatus, listTasks, createTask, updateTask, deleteTask } from "../../lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const statusOptions: { label: string; value: TaskStatus }[] = [
  { label: "To do", value: "TODO" },
  { label: "In progress", value: "IN_PROGRESS" },
  { label: "Done", value: "DONE" },
];

export default function DashboardPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: user, isError: userError, isLoading: userLoading } = useCurrentUser();
  const logoutMutation = useLogout();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [draft, setDraft] = useState({ title: "", description: "", tags: "", status: "TODO" as TaskStatus });
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const tasksQuery = useQuery({
    queryKey: ["tasks", { search: debouncedSearch, statusFilter }],
    queryFn: () => {
      const filters: { q?: string; status?: TaskStatus } = {};
      if (debouncedSearch) filters.q = debouncedSearch;
      if (statusFilter !== "ALL") filters.status = statusFilter as TaskStatus;
      console.log("Fetching tasks with filters:", filters);
      return listTasks(filters);
    },
    enabled: !!user,
  });

  // Mark as loaded once data is fetched
  useEffect(() => {
    if (tasksQuery.data && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [tasksQuery.data, hasLoadedOnce]);

  useEffect(() => {
    if (!userLoading && userError) router.replace("/login");
  }, [userError, userLoading, router]);

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) => updateTask(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const statusCounts = useMemo(() => {
    const base = { TODO: 0, IN_PROGRESS: 0, DONE: 0 } as Record<TaskStatus, number>;
    (tasksQuery.data ?? []).forEach((t) => base[t.status]++);
    return base;
  }, [tasksQuery.data]);

  const openCreate = () => {
    setEditing(null);
    setDraft({ title: "", description: "", tags: "", status: "TODO" });
    setOpenModal(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setDraft({
      title: task.title,
      description: task.description,
      tags: task.tags.join(", "),
      status: task.status,
    });
    setOpenModal(true);
  };

  const handleSave = async () => {
    if (!draft.title || !draft.description) {
      toast.error("Title and description are required");
      return;
    }
    const payload = {
      title: draft.title,
      description: draft.description,
      tags: draft.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      status: draft.status,
    };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: payload });
        toast.success("Task updated");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Task created");
      }
      setOpenModal(false);
    } catch (err: any) {
      toast.error(err?.message || "Save failed");
    }
  };

  const handleQuickStatus = async (task: Task, status: TaskStatus) => {
    try {
      await updateMutation.mutateAsync({ id: task.id, data: { status } });
      toast.success("Status updated");
    } catch (err: any) {
      toast.error(err?.message || "Update failed");
    }
  };

  const handleDelete = (task: Task) => {
    setTaskToDelete(task);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      await deleteMutation.mutateAsync(taskToDelete.id);
      toast.success("Task deleted");
      setTaskToDelete(null);
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    }
  };

  if (userLoading || (tasksQuery.isLoading && !hasLoadedOnce)) {
    return <LoaderScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated background curves */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.06]">
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
          <motion.path
            d="M 0 250 Q 480 180, 960 280 Q 1440 380, 1920 250"
            stroke="black"
            strokeWidth="24"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
          />
          <motion.path
            d="M 0 600 Q 480 700, 960 550 Q 1440 400, 1920 650"
            stroke="black"
            strokeWidth="24"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.5, ease: "easeInOut", delay: 0.4 }}
          />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto flex-1 w-full px-6 py-8 relative z-10">
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-4xl font-light tracking-tight text-[--ink] mb-4">Dashboard</h1>
            {user && (
              <div className="flex flex-col gap-1">
                <p className="text-base font-medium text-[--ink]">{user.name}</p>
                <p className="text-sm text-[--muted]">{user.email}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-sm text-[--muted]">Total tasks:</span>
                  <div className="overflow-hidden relative h-[24px] min-w-[24px]">
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={tasksQuery.data?.length ?? 0}
                        initial={{ y: 24, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -24, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="absolute inset-0 flex items-center text-lg font-semibold text-[--ink]"
                      >
                        {tasksQuery.data?.length ?? 0}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              size="md" 
              onClick={() => logoutMutation.mutate()}
              className="cursor-pointer transition-all duration-200"
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
            <Button 
              size="md" 
              onClick={openCreate}
              className="cursor-pointer transition-all duration-200"
            >
              New task
            </Button>
          </div>
        </motion.div>

        {/* Status counts */}
        <div className="grid gap-6 sm:grid-cols-3 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="text-xs uppercase tracking-wider font-medium text-[--muted] mb-3">To do</div>
              <div className="text-4xl font-light text-[--ink] overflow-hidden relative h-[48px]">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={statusCounts.TODO}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -40, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="absolute inset-0 flex items-center"
                  >
                    {statusCounts.TODO ?? 0}
                  </motion.span>
                </AnimatePresence>
              </div>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="text-xs uppercase tracking-wider font-medium text-[--muted] mb-3">In progress</div>
              <div className="text-4xl font-light text-[--ink] overflow-hidden relative h-[48px]">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={statusCounts.IN_PROGRESS}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -40, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="absolute inset-0 flex items-center"
                  >
                    {statusCounts.IN_PROGRESS ?? 0}
                  </motion.span>
                </AnimatePresence>
              </div>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="text-xs uppercase tracking-wider font-medium text-[--muted] mb-3">Done</div>
              <div className="text-4xl font-light text-[--ink] overflow-hidden relative h-[48px]">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={statusCounts.DONE}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -40, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="absolute inset-0 flex items-center"
                  >
                    {statusCounts.DONE ?? 0}
                  </motion.span>
                </AnimatePresence>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div 
          className="mb-10 flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex-1">
            <Input 
              placeholder="Search tasks..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 transition-all duration-200"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={statusFilter === "ALL" ? "solid" : "outline"}
              size="md"
              onClick={() => setStatusFilter("ALL")}
              className="cursor-pointer transition-all duration-200 min-w-[80px]"
            >
              All
            </Button>
            <Button
              variant={statusFilter === "TODO" ? "solid" : "outline"}
              size="md"
              onClick={() => setStatusFilter("TODO")}
              className="cursor-pointer transition-all duration-200 min-w-[80px]"
            >
              To Do
            </Button>
            <Button
              variant={statusFilter === "IN_PROGRESS" ? "solid" : "outline"}
              size="md"
              onClick={() => setStatusFilter("IN_PROGRESS")}
              className="cursor-pointer transition-all duration-200 min-w-[100px]"
            >
              In Progress
            </Button>
            <Button
              variant={statusFilter === "DONE" ? "solid" : "outline"}
              size="md"
              onClick={() => setStatusFilter("DONE")}
              className="cursor-pointer transition-all duration-200 min-w-[80px]"
            >
              Done
            </Button>
          </div>
        </motion.div>

        {/* Tasks list */}
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {tasksQuery.isLoading && (
            <Card className="animate-pulse">
              <div className="h-20 bg-gray-100 rounded"></div>
            </Card>
          )}
          {tasksQuery.data && tasksQuery.data.length === 0 && (
            <Card className="text-center py-8">
              <p className="text-[--muted]">
                {debouncedSearch || statusFilter !== "ALL"
                  ? `No ${statusFilter !== "ALL" ? statusOptions.find(s => s.value === statusFilter)?.label.toLowerCase() : ''} tasks ${debouncedSearch ? `matching "${debouncedSearch}"` : ''} found`
                  : "No tasks. Create one to get started."}
              </p>
            </Card>
          )}
          {tasksQuery.data && tasksQuery.data.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
            >
              <Card className="transition-all duration-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-[--ink] mb-1">{task.title}</h3>
                  <p className="text-sm text-[--muted] mb-3">{task.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Pill className={`transition-all duration-150 ${task.status === "TODO" ? "bg-gray-100" : task.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                      {statusOptions.find((s) => s.value === task.status)?.label}
                    </Pill>
                    {task.tags.map((t) => (
                      <Pill key={t} className="transition-all duration-150">{t}</Pill>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => openEdit(task)}
                    className="cursor-pointer transition-all duration-200"
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(task)}
                    className="cursor-pointer transition-all duration-200"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Modal */}
      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={editing ? "Edit task" : "New task"}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[--ink] mb-1.5 block">Title</label>
            <Input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium text-[--ink] mb-1.5 block">Description</label>
            <TextArea rows={3} value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium text-[--ink] mb-1.5 block">Tags (comma separated)</label>
            <Input placeholder="design, frontend" value={draft.tags} onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium text-[--ink] mb-1.5 block">Status</label>
            <div className="flex gap-2">
              {statusOptions.map((s) => (
                <Button
                  key={s.value}
                  size="sm"
                  variant={draft.status === s.value ? "solid" : "outline"}
                  onClick={() => setDraft((d) => ({ ...d, status: s.value }))}
                  className="cursor-pointer transition-all duration-200"
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setOpenModal(false)}
              className="cursor-pointer transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={createMutation.isPending || updateMutation.isPending}
              className="cursor-pointer transition-all duration-200"
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : editing ? "Save" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal open={!!taskToDelete} title="Delete Task" onClose={() => setTaskToDelete(null)}>
        <p className="text-[--muted] mb-6">
          Are you sure you want to delete <span className="font-medium text-[--ink]">{taskToDelete?.title}</span>? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => setTaskToDelete(null)}
            className="cursor-pointer transition-all duration-200"
          >
            Cancel
          </Button>
          <Button
            variant="solid"
            onClick={confirmDelete}
            disabled={deleteMutation.isPending}
            className="cursor-pointer transition-all duration-200 bg-red-600 hover:bg-red-700 text-white"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto py-8 text-center border-t border-[--border] mt-16">
        <p className="text-sm text-[--muted]">
          Made by <span className="text-[--ink] font-medium">Vansh Nagpal</span>
        </p>
      </footer>
    </div>
  );
}
