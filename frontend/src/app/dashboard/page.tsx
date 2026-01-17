"use client";

import { TrashBin } from "@/components/dashboard/TrashBin";
import { NotificationPanel } from "@/components/dashboard/NotificationPanel";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { KanbanBoard } from "../../components/kanban/KanbanBoard";
import { TaskListItem } from "../../components/dashboard/TaskListItem";
import { TaskViewModal } from "../../components/dashboard/TaskViewModal";
import { CreateTaskModal } from "../../components/dashboard/CreateTaskModal";
import { ShortcutsModal } from "../../components/dashboard/ShortcutsModal";
import { CalendarView } from "../../components/dashboard/CalendarView";
import { useCurrentUser, useLogout } from "../../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CountdownButton } from "@/components/ui/CountdownButton";
import { Input } from "@/components/ui/input";

import { Modal } from "../../components/ui/modal";
import { LoaderScreen, Loader } from "../../components/ui/loader";
import { CustomSelect } from "../../components/ui/select";
import { SettingsModal } from "../../components/dashboard/SettingsModal";
import { UrgencyBadge } from "../../components/ui/UrgencyBadge";
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
  shareTask,
  getCollaborators,
  updateCollaboratorPermission,
  removeCollaborator,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  deleteNotification,
  clearAllNotifications,
  exportTasks,
  generateSubtasks,
  generateSubtasksStream,
  downloadBlob,
  checkUserByEmail,
  getUnreadCount,
  restoreTask,
  permanentDeleteTask,
  type Task as TaskType,
  type TaskStatus as TaskStatusType,
  type Permission as PermissionType
} from "@/lib/api";
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
  CalendarDays,
  Calendar,
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
  const [statusFilter, setStatusFilter] = useState<TaskStatus[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [viewing, setViewing] = useState<Task | null>(null); // New: for view modal
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [viewMode, setViewMode] = useState<"LIST" | "BOARD" | "CALENDAR">("LIST");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"profile" | "preferences">("profile");

  // Shortcuts
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if input/textarea is focused or if a modal (CreateTask/TaskView) is open (unless it's just Shortcuts modal we are toggling)
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Create Task: C (Only if no other modal is open)
      if (e.key.toLowerCase() === "c" && !e.metaKey && !e.ctrlKey && !openModal && !viewing) {
        e.preventDefault();
        setOpenModal(true);
      }

      // Shortcuts Modal: Shift + ?
      if (e.key === "?" && e.shiftKey) {
        e.preventDefault();
        setShortcutsOpen(prev => !prev);
      }

      // Search: Ctrl/Cmd + K
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openModal, viewing]);


  // Set default view from user profile
  useEffect(() => {
    if (user && user.defaultView) {
      setViewMode(user.defaultView);
    }
  }, [user]);

  // Share modal
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [clearNotifsConfirm, setClearNotifsConfirm] = useState(false);
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
    enabled: !!user,
    staleTime: 10000,
    refetchInterval: 30000, // Check for new notifications every 30 seconds
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

    if (activeTab === "my-tasks" && statusFilter.length > 0) {
      tasks = tasks.filter(t => statusFilter.includes(t.status));
    }

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }

    return tasks;
  }, [activeTab, allMyTasks, archivedQuery.data, sharedQuery.data, statusFilter, debouncedSearch]);

  // Kanban tasks should NOT be filtered by status, otherwise columns disappear
  const kanbanTasks = useMemo(() => {
    let tasks = activeTab === "my-tasks" ? allMyTasks : activeTab === "archived" ? (archivedQuery.data ?? []) : (sharedQuery.data ?? []);

    // Skip status filter for Kanban

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }

    return tasks;
  }, [activeTab, allMyTasks, archivedQuery.data, sharedQuery.data, debouncedSearch]);

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

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["trash"] });
      setTaskToDelete(null);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: restoreTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["trash"] });
    }
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: permanentDeleteTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trash"] });
      setTaskToDelete(null);
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["unreadCount"] });
    }
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["unreadCount"] });
    }
  });

  const clearAllNotificationsMutation = useMutation({
    mutationFn: clearAllNotifications,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["unreadCount"] });
    }
  });

  // Handlers
  const handleClearAllNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    setClearNotifsConfirm(true);
  };

  const handleMarkRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markReadMutation.mutate(id);
  };

  const handleDismissNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotificationMutation.mutate(id);
  };

  const openCreate = () => {
    setEditing(null);
    setViewing(null);
    setOpenModal(true);
  };

  // Open view modal (clicking on a task)
  const openView = (task: Task) => {
    setViewing(task);
  };

  // Open edit modal (from view modal or directly)
  const openEdit = (task: Task) => {
    setViewing(null);
    setEditing(task);
    setOpenModal(true);
  };

  const openShare = (task: Task) => {
    setSharingTask(task);
    setShareModalOpen(true);
    setShareEmail("");
    setSharePermission("VIEWER");
  };

  const handleTaskSubmit = async (data: any) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data });
        toast.success("Task updated");
      } else {
        const newTask = await createMutation.mutateAsync(data);
        toast.success("Task created");

        // Handle Share on Create (Enhanced Flow)
        if (data.pendingCollaborators && Array.isArray(data.pendingCollaborators) && data.pendingCollaborators.length > 0) {
          // We use Promise.allSettled to ensure one failure doesn't stop others (though typically we want them all)
          // or just simple loop. 
          await Promise.allSettled(data.pendingCollaborators.map((c: any) =>
            shareMutation.mutateAsync({
              taskId: newTask.id,
              email: c.email,
              permission: c.permission
            })
          ));
          toast.success(`Invites sent to ${data.pendingCollaborators.length} collaborators`);
        }
      }
      setOpenModal(false);
    } catch (err: any) {
      toast.error(err?.message || "Save failed");
    }
  };

  const handleAI = async (title: string, userPrompt: string) => {
    try {
      const res = await generateSubtasks(title, userPrompt);
      return res.subtasks;
    } catch (err) {
      toast.error("Failed to generate");
      throw err;
    }
  };

  // Streaming AI handler for real-time text display
  const handleAIStream = async (
    title: string,
    userPrompt: string,
    onChunk: (chunk: string) => void
  ): Promise<string> => {
    try {
      const result = await generateSubtasksStream(title, userPrompt, onChunk);
      return result;
    } catch (err) {
      toast.error("Failed to generate");
      throw err;
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

    // Validation
    if (user?.email === shareEmail) {
      toast.error("You cannot invite yourself");
      return;
    }
    if (collaboratorsQuery.data?.collaborators.some(c => c.email === shareEmail)) {
      toast.error("User is already a collaborator");
      return;
    }

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



  const handleNotificationClick = (n: Notification) => {
    setShowNotifications(false);

    // Find task in any of the lists
    const allKnownTasks = [...(myTasksQuery.data ?? []), ...(sharedQuery.data ?? []), ...(archivedQuery.data ?? [])];
    const task = allKnownTasks.find(t => t.id === n.taskId);

    if (task) {
      // Open in view mode regardless of permissions - consistency
      openView(task);
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#0d9488" }}>
              <span className="text-white font-semibold text-[10px] tracking-tighter">TM</span>
            </div>
            <span className="font-medium text-gray-900">TM Dashboard</span>
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
                  <NotificationPanel
                    notifications={notifications}
                    onMarkRead={handleMarkRead}
                    onDismiss={handleDismissNotification}
                    onClearAll={handleClearAllNotifications}
                    onItemClick={handleNotificationClick}
                    clearConfirmOpen={clearNotifsConfirm}
                    setClearConfirmOpen={setClearNotifsConfirm}
                    isClearing={clearAllNotificationsMutation.isPending}
                  />
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
              onClick={() => { setSettingsTab("profile"); setSettingsOpen(true); }}
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
        </div >
      </header >

      <main className="flex-1 max-w-[1500px] mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 h-[calc(100vh-65px)] overflow-y-auto">
        <div className="flex flex-col lg:flex-row gap-6 h-full">
          {/* Main Content */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                {[
                  { key: "my-tasks", label: "My Tasks", icon: ListTodo },
                  { key: "shared", label: "Shared", icon: Users },
                  { key: "archived", label: "Archived", icon: Archive },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => { setActiveTab(tab.key as TabType); setStatusFilter([]); }}
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

              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-gray-100 p-1 rounded-lg flex gap-1">
                  <button
                    onClick={() => { setViewMode("LIST"); setStatusFilter([]); }}
                    className={`p-1.5 rounded-md transition-all ${viewMode === "LIST" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                      }`}
                  >
                    <LayoutList className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setViewMode("BOARD"); setStatusFilter([]); }}
                    className={`p-1.5 rounded-md transition-all ${viewMode === "BOARD" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                      }`}
                  >
                    <KanbanSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setViewMode("CALENDAR"); setStatusFilter([]); }}
                    className={`p-1.5 rounded-md transition-all ${viewMode === "CALENDAR" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                      }`}
                  >
                    <CalendarDays className="w-4 h-4" />
                  </button>
                </div>

                {viewMode === "LIST" && (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setStatusFilter([])}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${statusFilter.length === 0
                        ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                      All
                    </button>
                    {statusOptions.map((s) => {
                      const isActive = statusFilter.includes(s.value);
                      return (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => {
                            setStatusFilter(prev =>
                              isActive
                                ? prev.filter(p => p !== s.value)
                                : [...prev, s.value]
                            );
                          }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${isActive
                            ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Filtered Count */}
            {statusFilter.length > 0 && (
              <p className="text-sm text-gray-500 mb-4">
                Showing {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
                <span className="text-gray-400 mx-2">•</span>
                Filters: {statusFilter.map(s => statusOptions.find(o => o.value === s)?.label).join(", ")}
              </p>
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
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No tasks found</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    {statusFilter.length > 0 ? "Try adjusting your filters" :
                      activeTab === "archived" ? "Archived tasks will appear here" :
                        activeTab === "shared" ? "Tasks shared with you appear here" :
                          "Create your first task"}
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
                  tasks={kanbanTasks}
                  onStatusChange={(taskId, newStatus) => updateMutation.mutate({ id: taskId, data: { status: newStatus } })}
                  onEdit={openView}
                  onDelete={(task) => setTaskToDelete(task)}
                  onShare={openShare}
                  isUpdating={updateMutation.isPending}
                />
              ) : viewMode === "CALENDAR" ? (
                <CalendarView tasks={filteredTasks} onTaskClick={openView} />
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
                      onEdit={openView}
                      onShare={openShare}
                      onArchive={(id) => archiveMutation.mutate(id)}
                      onUnarchive={(id) => unarchiveMutation.mutate(id)}
                      onDelete={() => setTaskToDelete(task)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar (Upcoming) */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                Upcoming Deadlines
              </h3>
              <div className="space-y-3">
                {allMyTasks
                  .filter(t => (t.dueDate || t.isTimeBased) && t.status !== "DONE" && !t.archived)
                  .sort((a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime())
                  .slice(0, 5)
                  .map(task => (
                    <button
                      key={task.id}
                      onClick={() => openView(task)}
                      className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-700 truncate group-hover:text-teal-700 flex-1">{task.title}</p>
                        <UrgencyBadge dueDate={task.dueDate} status={task.status} showLabel={false} />
                      </div>
                      {task.dueDate && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.dueDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </p>
                      )}
                    </button>
                  ))}
                {allMyTasks.filter(t => (t.dueDate || t.isTimeBased) && t.status !== "DONE").length === 0 && (
                  <p className="text-xs text-gray-400 italic text-center py-2">No upcoming deadlines</p>
                )}
              </div>
            </div>

            {/* Trash Bin */}
            <TrashBin onView={openView} />
          </div>
        </div>
      </main>



      {/* Task View Modal */}
      <TaskViewModal
        open={!!viewing}
        task={viewing}
        onClose={() => setViewing(null)}
        onEdit={() => viewing && openEdit(viewing)}
        onShare={() => viewing && openShare(viewing)}
        onDelete={() => {
          if (viewing) {
            setTaskToDelete(viewing);
            setViewing(null);
          }
        }}
        onRestore={() => {
          if (viewing) {
            restoreMutation.mutate(viewing.id);
            setViewing(null);
          }
        }}
        onPermanentDelete={() => {
          if (viewing) {
            setTaskToDelete(viewing);
            setViewing(null);
          }
        }}
        canEdit={viewing ? canEdit(viewing) : false}
        canShare={viewing ? canShare(viewing) : false}
        canDelete={viewing ? canDelete(viewing) : false}
      />


      {/* Shortcuts Modal */}
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {/* Create/Edit Modal */}
      <CreateTaskModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        initialData={editing}
        onSubmit={handleTaskSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        canEdit={!editing || canEdit(editing)}
        onGenerateAI={handleAI}
        onGenerateAIStream={handleAIStream}
        onOpenSettings={() => { setSettingsTab("preferences"); setSettingsOpen(true); }}
      />

      {/* Delete Modal */}
      {/* Delete Modal */}
      <Modal
        open={!!taskToDelete}
        title={taskToDelete?.deletedAt ? "Delete Forever" : "Move to Trash"}
        onClose={() => setTaskToDelete(null)}
      >
        <p className="text-gray-600 mb-6">
          {taskToDelete?.deletedAt
            ? <span>Permanently delete <span className="font-medium text-gray-900">{taskToDelete?.title}</span>? This cannot be undone.</span>
            : <span>Move <span className="font-medium text-gray-900">{taskToDelete?.title}</span> to trash? You can restore it later.</span>
          }
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setTaskToDelete(null)}>Cancel</Button>
          {taskToDelete?.deletedAt ? (
            <CountdownButton
              text="Delete Forever"
              variant="danger"
              onComplete={confirmDelete}
              disabled={permanentDeleteMutation.isPending}
              className="w-32"
            />
          ) : (
            <Button
              variant="danger"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Moving..." : "Trash"}
            </Button>
          )}
        </div>
      </Modal>

      {/* Share Modal */}
      <Modal open={shareModalOpen} onClose={() => setShareModalOpen(false)} title="Share Task" zIndex={60}>
        <div className="space-y-6">
          {/* Invite Input Row */}
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <Input
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="h-9"
              />
            </div>
            <div className="w-32">
              <CustomSelect
                value={sharePermission}
                onChange={(v) => setSharePermission(v as Permission)}
                options={[{ label: "Viewer", value: "VIEWER" }, { label: "Editor", value: "EDITOR" }]}
                size="sm"
                className="h-9"
              />
            </div>
            <Button
              onClick={handleShare}
              disabled={shareMutation.isPending || !shareEmail}
              size="sm"
              className="h-9 px-4"
            >
              Invite
            </Button>
          </div>

          {/* Collaborators List */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Collaborators</h4>
            {collaboratorsQuery.isLoading ? (
              <div className="text-center py-6"><Loader size="sm" /></div>
            ) : collaboratorsQuery.data?.collaborators.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-sm text-gray-500 italic">No one else has access yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {collaboratorsQuery.data?.collaborators.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md hover:border-teal-100 group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-50 to-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold shadow-sm border border-white">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 leading-none mb-1">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.permission === "OWNER" ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full tracking-wide">OWNER</span>
                      ) : c.id === user?.id ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 bg-white border border-gray-200 text-gray-500 rounded-full tracking-wide uppercase">{c.permission}</span>
                      ) : (
                        <div className="w-24">
                          <CustomSelect
                            value={c.permission}
                            onChange={(v) => updatePermissionMutation.mutate({
                              taskId: sharingTask!.id,
                              userId: c.id,
                              permission: v as "VIEWER" | "EDITOR"
                            })}
                            options={[
                              { label: "Viewer", value: "VIEWER" },
                              { label: "Editor", value: "EDITOR" }
                            ]}
                            size="sm"
                            className="h-8 text-xs"
                          />
                        </div>
                      )}

                      {c.id !== user?.id && sharingTask?.isOwner && (
                        <button
                          onClick={() => removeCollabMutation.mutate({ taskId: sharingTask.id, userId: c.id })}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
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

      {/* Clear Notifications Confirmation Modal */}
      <Modal open={clearNotifsConfirm} title="Clear All Notifications" onClose={() => setClearNotifsConfirm(false)}>
        <p className="text-gray-600 mb-6">Are you sure you want to clear all your notifications? This action cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setClearNotifsConfirm(false)}>Cancel</Button>
          <CountdownButton
            text="Clear All"
            variant="danger"
            onComplete={() => {
              clearAllNotificationsMutation.mutate();
              setClearNotifsConfirm(false);
            }}
            disabled={clearAllNotificationsMutation.isPending}
            className="w-32"
          />
        </div>
      </Modal>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} defaultTab={settingsTab} />
    </div >
  );
}
