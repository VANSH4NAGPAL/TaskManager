"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { KanbanBoard } from "../../components/kanban/KanbanBoard";
import { TaskListItem } from "../../components/dashboard/TaskListItem";
import { useCurrentUser, useLogout } from "../../hooks/useAuth";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { TextArea } from "../../components/ui/textarea";
import { Modal } from "../../components/ui/modal";
import { LoaderScreen, Loader } from "../../components/ui/loader";
import { CustomSelect } from "../../components/ui/select";
import { SettingsModal } from "../../components/dashboard/SettingsModal";
import {
  Task,
  TaskStatus,
  Permission,
  Notification,
  listTasks,
  getSharedTasks,
  createTask,
  updateTask,
  deleteTask,
  archiveTask,
  unarchiveTask,
  exportTasks,
  downloadBlob,
  shareTask,
  getCollaborators,
  updateCollaboratorPermission,
  removeCollaborator,
  getNotifications,
  markAllNotificationsRead,
  generateSubtasks,
} from "../../lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Search,
  LogOut,
  CheckCircle2,
  Clock,
  Circle,
  Pencil,
  Trash2,
  ListTodo,
  Archive,
  Download,
  Users,
  Share2,
  X,
  ArchiveRestore,
  Bell,
  ChevronDown,
  FileJson,
  FileSpreadsheet,
  FileText,
  LayoutList,
  KanbanSquare,
  Settings,
  Wand2,
} from "lucide-react";

const statusOptions: { label: string; value: TaskStatus; color: string; bgColor: string }[] = [
  { label: "To do", value: "TODO", color: "#6b7280", bgColor: "#f3f4f6" },
  { label: "In progress", value: "IN_PROGRESS", color: "#f59e0b", bgColor: "#fef3c7" },
  { label: "Done", value: "DONE", color: "#10b981", bgColor: "#d1fae5" },
];

type TabType = "my-tasks" | "shared" | "archived";
type FilterType = "ALL" | TaskStatus;

// Smooth dropdown animation config
const dropdownVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -4,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30,
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -4,
    transition: {
      duration: 0.15,
    }
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: user, isError: userError, isLoading: userLoading } = useCurrentUser();
  const logoutMutation = useLogout();

  const [activeTab, setActiveTab] = useState<TabType>("my-tasks");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterType>("ALL");
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [draft, setDraft] = useState({ title: "", description: "", tags: "", status: "TODO" as TaskStatus });
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [viewMode, setViewMode] = useState<"LIST" | "BOARD">("LIST");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Set default view from user profile
  useEffect(() => {
    if (user && user.defaultView) {
      setViewMode(user.defaultView);
    }
  }, [user]);

  // Share modal
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharingTask, setSharingTask] = useState<Task | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [sharePermission, setSharePermission] = useState<Permission>("VIEWER");

  // Dropdowns
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Refs for dropdown containers
  const exportRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Queries
  const myTasksQuery = useQuery({
    queryKey: ["tasks", "my"],
    queryFn: () => listTasks({ archived: false }),
    enabled: !!user,
    staleTime: 30000,
  });

  const archivedQuery = useQuery({
    queryKey: ["tasks", "archived"],
    queryFn: () => listTasks({ archived: true }),
    enabled: !!user && activeTab === "archived",
    staleTime: 30000,
  });

  const sharedQuery = useQuery({
    queryKey: ["tasks", "shared"],
    queryFn: getSharedTasks,
    enabled: !!user && activeTab === "shared",
    staleTime: 30000,
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: !!user && showNotifications,
    staleTime: 10000,
  });

  const collaboratorsQuery = useQuery({
    queryKey: ["collaborators", sharingTask?.id],
    queryFn: () => sharingTask ? getCollaborators(sharingTask.id) : null,
    enabled: !!sharingTask && shareModalOpen,
  });

  // Filtered tasks
  const allMyTasks = myTasksQuery.data ?? [];

  const filteredTasks = useMemo(() => {
    let tasks = activeTab === "my-tasks" ? allMyTasks : activeTab === "archived" ? (archivedQuery.data ?? []) : (sharedQuery.data ?? []);

    if (activeTab === "my-tasks" && statusFilter !== "ALL") {
      tasks = tasks.filter(t => t.status === statusFilter);
    }

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }

    return tasks;
  }, [activeTab, allMyTasks, archivedQuery.data, sharedQuery.data, statusFilter, debouncedSearch]);

  // Stats
  const stats = useMemo(() => {
    const all = allMyTasks;
    return {
      total: all.length,
      todo: all.filter(t => t.status === "TODO").length,
      inProgress: all.filter(t => t.status === "IN_PROGRESS").length,
      done: all.filter(t => t.status === "DONE").length,
    };
  }, [allMyTasks]);

  const isLoading = activeTab === "my-tasks" ? myTasksQuery.isLoading : activeTab === "archived" ? archivedQuery.isLoading : sharedQuery.isLoading;

  useEffect(() => {
    if (filteredTasks.length > 0 && !hasLoadedOnce) setHasLoadedOnce(true);
  }, [filteredTasks, hasLoadedOnce]);

  useEffect(() => {
    if (!userLoading && userError) router.replace("/login");
  }, [userError, userLoading, router]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) => updateTask(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const archiveMutation = useMutation({
    mutationFn: archiveTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task archived");
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: unarchiveTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task restored");
    },
  });

  const shareMutation = useMutation({
    mutationFn: ({ taskId, email, permission }: { taskId: string; email: string; permission: Permission }) =>
      shareTask(taskId, email, permission),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["collaborators"] });
      toast.success(data.message || "Shared successfully");
      setShareEmail("");
    },
    onError: (err: any) => toast.error(err.message || "Failed to share"),
  });

  const updatePermissionMutation = useMutation({
    mutationFn: ({ taskId, userId, permission }: { taskId: string; userId: string; permission: Permission }) =>
      updateCollaboratorPermission(taskId, userId, permission),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collaborators"] });
      toast.success("Permission updated");
    },
  });

  const removeCollabMutation = useMutation({
    mutationFn: ({ taskId, userId }: { taskId: string; userId: string }) => removeCollaborator(taskId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collaborators"] });
      toast.success("Removed");
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  // Handlers
  const openCreate = () => {
    setEditing(null);
    setDraft({ title: "", description: "", tags: "", status: "TODO" });
    setOpenModal(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setDraft({ title: task.title, description: task.description, tags: task.tags.join(", "), status: task.status });
    setOpenModal(true);
  };

  const openShare = (task: Task) => {
    setSharingTask(task);
    setShareModalOpen(true);
    setShareEmail("");
    setSharePermission("VIEWER");
  };

  const handleSave = async () => {
    if (!draft.title || !draft.description) {
      toast.error("Title and description are required");
      return;
    }
    const payload = {
      title: draft.title,
      description: draft.description,
      tags: draft.tags.split(",").map(t => t.trim()).filter(Boolean),
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

  const handleExport = async (format: "json" | "csv" | "pdf") => {
    setShowExportMenu(false);
    try {
      const blob = await exportTasks(format);
      downloadBlob(blob, `tasks-${new Date().toISOString().split("T")[0]}.${format}`);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch {
      toast.error("Export failed");
    }
  };

  const handleShare = async () => {
    if (!sharingTask || !shareEmail) return;
    await shareMutation.mutateAsync({ taskId: sharingTask.id, email: shareEmail, permission: sharePermission });
  };

  const toggleExport = () => {
    setShowExportMenu(prev => !prev);
    setShowNotifications(false);
  };

  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
    setShowExportMenu(false);
  };

  const handleGenerate = async () => {
    if (!draft.title) {
      toast.error("Please enter a title first");
      return;
    }
    setIsGenerating(true);
    try {
      const { subtasks, tags } = await generateSubtasks(draft.title, draft.description);

      setDraft(prev => {
        const newDescription = prev.description ? `${prev.description}\n\n${subtasks}` : subtasks;

        // Merge tags
        const existingTags = prev.tags.split(",").map(t => t.trim()).filter(Boolean);
        const newTags = [...new Set([...existingTags, ...tags])];

        return {
          ...prev,
          description: newDescription,
          tags: newTags.join(", ")
        };
      });

      toast.success("AI generated subtasks and tags!");
    } catch (err) {
      toast.error("Failed to generate details");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNotificationClick = (n: Notification) => {
    setShowNotifications(false);

    // Find task in any of the lists
    const allKnownTasks = [...(myTasksQuery.data ?? []), ...(sharedQuery.data ?? []), ...(archivedQuery.data ?? [])];
    const task = allKnownTasks.find(t => t.id === n.taskId);

    if (task) {
      if (canEdit(task)) {
        openEdit(task);
      } else {
        // Open in view mode
        setEditing(task);
        if (!task.archived) setDraft({ title: task.title, description: task.description, tags: task.tags.join(", "), status: task.status });
        setOpenModal(true);
      }
    } else {
      toast.error("Task not found or unavailable");
    }
  };

  if (userLoading || (isLoading && !hasLoadedOnce)) {
    return <LoaderScreen />;
  }

  const canEdit = (task: Task) => task.isOwner || task.myPermission === "EDITOR";
  const canDelete = (task: Task) => task.isOwner === true;
  const canShare = (task: Task) => task.isOwner || task.myPermission === "EDITOR" || task.myPermission === "VIEWER";

  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;
  const notifications = notificationsQuery.data?.notifications ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-dots" style={{ backgroundColor: "#fafafa" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#0d9488" }}>
              <span className="text-white font-semibold text-sm">P</span>
            </div>
            <span className="font-medium text-gray-900">PrimeDashboard</span>
          </Link>

          <div className="flex items-center gap-1">
            {/* Export Dropdown */}
            <div className="relative" ref={exportRef}>
              <button
                type="button"
                onClick={toggleExport}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-all ${showExportMenu
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showExportMenu ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {showExportMenu && (
                  <motion.div
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute right-0 mt-2 w-44 bg-white rounded-xl border shadow-xl overflow-hidden z-50"
                    style={{ borderColor: "#e5e7eb" }}
                  >
                    <div className="p-1">
                      <button
                        type="button"
                        onClick={() => handleExport("json")}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <FileJson className="w-4 h-4 text-teal-600" />
                        <span>JSON</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport("csv")}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span>Spreadsheet</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExport("pdf")}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <FileText className="w-4 h-4 text-red-500" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={toggleNotifications}
                className={`relative p-2 rounded-lg transition-all ${showNotifications
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-medium bg-red-500 text-white rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute right-0 mt-2 w-80 bg-white rounded-xl border shadow-xl z-50 overflow-hidden"
                    style={{ borderColor: "#e5e7eb" }}
                  >
                    <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: "#e5e7eb" }}>
                      <span className="font-semibold text-gray-900 text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => markAllReadMutation.mutate()}
                          className="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notificationsQuery.isLoading ? (
                        <div className="p-6 flex justify-center">
                          <Loader size="sm" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-6 text-center">
                          <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`px-4 py-3 border-b last:border-0 transition-colors cursor-pointer hover:bg-gray-50 ${n.read ? "bg-white" : "bg-teal-50/60"
                              }`}
                            style={{ borderColor: "#f3f4f6" }}
                          >
                            <p className="text-sm text-gray-700 leading-relaxed"><span className="font-semibold text-gray-900">{n.taskTitle}</span>: {n.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-6 bg-gray-200 mx-2" />

            {user && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ backgroundColor: "#0d9488" }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">{user.name}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => logoutMutation.mutate()}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border" style={{ borderColor: "#e5e7eb" }}>
            <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
          <div className="bg-white rounded-xl p-4 border" style={{ borderColor: "#e5e7eb" }}>
            <p className="text-2xl font-semibold" style={{ color: "#6b7280" }}>{stats.todo}</p>
            <p className="text-sm text-gray-500">To do</p>
          </div>
          <div className="bg-white rounded-xl p-4 border" style={{ borderColor: "#e5e7eb" }}>
            <p className="text-2xl font-semibold" style={{ color: "#f59e0b" }}>{stats.inProgress}</p>
            <p className="text-sm text-gray-500">In progress</p>
          </div>
          <div className="bg-white rounded-xl p-4 border" style={{ borderColor: "#e5e7eb" }}>
            <p className="text-2xl font-semibold" style={{ color: "#10b981" }}>{stats.done}</p>
            <p className="text-sm text-gray-500">Completed</p>
          </div>
        </div>

        {/* Tabs & Actions */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {[
              { key: "my-tasks", label: "My Tasks", icon: ListTodo },
              { key: "shared", label: "Shared", icon: Users },
              { key: "archived", label: "Archived", icon: Archive },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => { setActiveTab(tab.key as TabType); setStatusFilter("ALL"); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "my-tasks" && (
            <Button onClick={openCreate} size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              New Task
            </Button>
          )}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 justify-between">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10" />
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-1 rounded-lg flex gap-1">
              <button
                onClick={() => setViewMode("LIST")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "LIST" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                  }`}
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("BOARD")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "BOARD" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                  }`}
              >
                <KanbanSquare className="w-4 h-4" />
              </button>
            </div>

            {viewMode === "LIST" && (
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${statusFilter === "ALL" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                >
                  All
                </button>
                {statusOptions.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStatusFilter(s.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${statusFilter === s.value ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                      }`}
                    style={statusFilter === s.value ? { backgroundColor: s.color } : {}}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filtered Count */}
        {statusFilter !== "ALL" && (
          <p className="text-sm text-gray-500 mb-4">Showing {filteredTasks.length} {statusFilter.replace("_", " ").toLowerCase()} task{filteredTasks.length !== 1 ? "s" : ""}</p>
        )}

        {/* Tasks View (List or Board) */}
        <div className="h-full">
          {isLoading ? (
            <div className="bg-white rounded-xl border p-8 flex items-center justify-center" style={{ borderColor: "#e5e7eb" }}>
              <Loader size="md" />
            </div>
          ) : !isLoading && filteredTasks.length === 0 ? (
            <div className="bg-white rounded-xl border text-center py-12" style={{ borderColor: "#e5e7eb" }}>
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <ListTodo className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No tasks</h3>
              <p className="text-gray-500 text-sm mb-4">
                {activeTab === "archived" ? "Archived tasks will appear here" : activeTab === "shared" ? "Tasks shared with you appear here" : "Create your first task"}
              </p>
              {activeTab === "my-tasks" && (
                <Button onClick={openCreate} size="sm">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Task
                </Button>
              )}
            </div>
          ) : viewMode === "BOARD" ? (
            <KanbanBoard
              tasks={filteredTasks}
              onStatusChange={(taskId, newStatus) => updateMutation.mutate({ id: taskId, data: { status: newStatus } })}
              onEdit={openEdit}
              onDelete={(task) => setTaskToDelete(task)}
              onShare={openShare}
              isUpdating={updateMutation.isPending}
            />
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task, i) => (
                <TaskListItem
                  key={task.id}
                  task={task}
                  index={i}
                  canEdit={canEdit}
                  canShare={canShare}
                  canDelete={canDelete}
                  onEdit={openEdit}
                  onShare={openShare}
                  onArchive={(id) => archiveMutation.mutate(id)}
                  onUnarchive={(id) => unarchiveMutation.mutate(id)}
                  onDelete={() => setTaskToDelete(task)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Share Modal */}
      <Modal open={shareModalOpen} onClose={() => setShareModalOpen(false)} title="Share Task">
        <div className="space-y-6">
          <div className="flex gap-2">
            <Input
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="flex-1"
            />
            <div className="w-32">
              <CustomSelect
                value={sharePermission}
                onChange={(v) => setSharePermission(v as Permission)}
                options={[{ label: "Viewer", value: "VIEWER" }, { label: "Editor", value: "EDITOR" }]}
              />
            </div>
            <Button onClick={handleShare} disabled={shareMutation.isPending || !shareEmail}>invite</Button>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Collaborators</h4>
            {collaboratorsQuery.isLoading ? (
              <div className="text-center py-4"><Loader size="sm" /></div>
            ) : collaboratorsQuery.data?.collaborators.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No one else has access</p>
            ) : (
              <div className="space-y-2">
                {collaboratorsQuery.data?.collaborators.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-semibold">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-2 py-1 bg-white border rounded text-gray-600">{c.permission}</span>
                      {c.id !== user?.id && sharingTask?.isOwner && (
                        <button
                          onClick={() => removeCollabMutation.mutate({ taskId: sharingTask.id, userId: c.id })}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Create/Edit Modal */}
      <Modal open={openModal} onClose={() => setOpenModal(false)} title={editing ? (canEdit(editing) ? "Edit Task" : "Task Details") : "New Task"}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Title</label>
            <Input
              value={draft.title}
              onChange={(e) => setDraft(d => ({ ...d, title: e.target.value }))}
              placeholder="Task title"
              disabled={!!editing && !canEdit(editing)}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !draft.title || (!!editing && !canEdit(editing))}
                className="text-xs flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? <Loader className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                {isGenerating ? "Thinking..." : "Generate Subtasks"}
              </button>
            </div>
            <TextArea
              rows={3}
              value={draft.description}
              onChange={(e) => setDraft(d => ({ ...d, description: e.target.value }))}
              placeholder="Add details..."
              disabled={!!editing && !canEdit(editing)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Tags</label>
            <Input
              value={draft.tags}
              onChange={(e) => setDraft(d => ({ ...d, tags: e.target.value }))}
              placeholder="design, frontend"
              disabled={!!editing && !canEdit(editing)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
            <div className="flex gap-2">
              {statusOptions.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setDraft(d => ({ ...d, status: s.value }))}
                  disabled={!!editing && !canEdit(editing)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${draft.status === s.value ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-200"
                    } ${editing && !canEdit(editing) ? "opacity-50 cursor-not-allowed" : ""}`}
                  style={draft.status === s.value ? { backgroundColor: s.color } : {}}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-3 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenModal(false)}>Close</Button>
            {(!editing || canEdit(editing)) && (
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : editing ? "Save" : "Create"}
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!taskToDelete} title="Delete Task" onClose={() => setTaskToDelete(null)}>
        <p className="text-gray-600 mb-6">Delete <span className="font-medium text-gray-900">{taskToDelete?.title}</span>? This cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setTaskToDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete} disabled={deleteMutation.isPending}>Delete</Button>
        </div>
      </Modal>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
