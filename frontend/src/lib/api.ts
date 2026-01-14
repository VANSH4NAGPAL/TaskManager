const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

let inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
  if (typeof window !== "undefined" && token) {
    window.localStorage.setItem("access_token", token);
  }
  if (typeof window !== "undefined" && !token) {
    window.localStorage.removeItem("access_token");
  }
}

export function loadAccessTokenFromStorage() {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem("access_token");
  inMemoryAccessToken = token;
  return token;
}

async function rawFetch(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: res.statusText }));
    const err: any = new Error(errorBody.message || "Request failed");
    err.status = res.status;
    err.details = errorBody.details;
    throw err;
  }

  if (res.status === 204) return null;
  return res.json();
}

async function authFetch(path: string, options: RequestInit = {}) {
  if (!inMemoryAccessToken && typeof window !== "undefined") {
    loadAccessTokenFromStorage();
  }

  const withAuth = {
    ...options,
    headers: {
      ...(options.headers as Record<string, string>),
      Authorization: inMemoryAccessToken ? `Bearer ${inMemoryAccessToken}` : "",
    },
  };

  try {
    return await rawFetch(path, withAuth);
  } catch (err: any) {
    if (err.status === 401) {
      await refreshAccessToken();
      const retry = {
        ...options,
        headers: {
          ...(options.headers as Record<string, string>),
          Authorization: inMemoryAccessToken ? `Bearer ${inMemoryAccessToken}` : "",
        },
      };
      return await rawFetch(path, retry);
    }
    throw err;
  }
}

async function authFetchBlob(path: string) {
  if (!inMemoryAccessToken && typeof window !== "undefined") {
    loadAccessTokenFromStorage();
  }

  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      Authorization: inMemoryAccessToken ? `Bearer ${inMemoryAccessToken}` : "",
    },
    credentials: "include",
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errorBody.message || "Request failed");
  }

  return res.blob();
}

// Auth
export async function signup(input: { name: string; email: string; password: string }) {
  const data = await rawFetch("/auth/signup", { method: "POST", body: JSON.stringify(input) });
  setAccessToken(data.accessToken);
  return data.user;
}

export async function login(input: { email: string; password: string }) {
  const data = await rawFetch("/auth/login", { method: "POST", body: JSON.stringify(input) });
  setAccessToken(data.accessToken);
  return data.user;
}

export async function refreshAccessToken() {
  const data = await rawFetch("/auth/refresh", { method: "POST" });
  setAccessToken(data.accessToken);
  return data.accessToken as string;
}

export async function logout() {
  await rawFetch("/auth/logout", { method: "POST" });
  setAccessToken(null);
}

export async function getProfile() {
  const data = await authFetch("/me");
  return data.user;
}

export async function updateProfile(input: { name?: string; defaultView?: "LIST" | "BOARD" }) {
  const data = await authFetch("/me", { method: "PATCH", body: JSON.stringify(input) });
  return data.user;
}

export async function generateSubtasks(title: string, description?: string) {
  const data = await authFetch("/ai/generate-subtasks", {
    method: "POST",
    body: JSON.stringify({ title, description }),
  });
  return data as { subtasks: string; tags: string[] };
}

// Types
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type Permission = "VIEWER" | "EDITOR";

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  permission: Permission | "OWNER";
  shareId?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  tags: string[];
  dueDate: string | null;
  archived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isOwner?: boolean;
  myPermission?: Permission;
  owner?: { id: string; name: string; email: string };
  sharedWith?: Array<{ id: string; permission: Permission; user: { id: string; name: string; email: string } }>;
}

export interface Notification {
  id: string;
  type: string;
  taskId: string;
  taskTitle: string;
  actorId: string;
  actorName: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// Tasks
export async function listTasks(params: { q?: string; status?: TaskStatus; tag?: string; archived?: boolean } = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.append("q", params.q);
  if (params.status) qs.append("status", params.status);
  if (params.tag) qs.append("tag", params.tag);
  if (params.archived !== undefined) qs.append("archived", String(params.archived));
  const search = qs.toString();
  const data = await authFetch(`/tasks${search ? `?${search}` : ""}`);
  return data.tasks as Task[];
}

export async function getSharedTasks() {
  const data = await authFetch("/tasks/shared");
  return data.tasks as Task[];
}

export async function createTask(input: { title: string; description: string; status?: TaskStatus; tags?: string[] }) {
  const data = await authFetch("/tasks", { method: "POST", body: JSON.stringify(input) });
  return data.task as Task;
}

export async function updateTask(id: string, input: Partial<Omit<Task, "id" | "createdAt" | "updatedAt">>) {
  const data = await authFetch(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(input) });
  return data.task as Task;
}

export async function deleteTask(id: string) {
  await authFetch(`/tasks/${id}`, { method: "DELETE" });
}

// Archive
export async function archiveTask(id: string) {
  const data = await authFetch(`/tasks/${id}/archive`, { method: "POST" });
  return data.task as Task;
}

export async function unarchiveTask(id: string) {
  const data = await authFetch(`/tasks/${id}/unarchive`, { method: "POST" });
  return data.task as Task;
}

// Export
export async function exportTasks(format: "json" | "csv" | "pdf" = "json") {
  return authFetchBlob(`/tasks/export?format=${format}`);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Sharing
export async function shareTask(taskId: string, email: string, permission: Permission) {
  const data = await authFetch(`/tasks/${taskId}/share`, { method: "POST", body: JSON.stringify({ email, permission }) });
  return data;
}

export async function getCollaborators(taskId: string) {
  const data = await authFetch(`/tasks/${taskId}/collaborators`);
  return data as { collaborators: Collaborator[]; myPermission: Permission | "OWNER" };
}

export async function updateCollaboratorPermission(taskId: string, userId: string, permission: Permission) {
  const data = await authFetch(`/tasks/${taskId}/share/${userId}`, { method: "PATCH", body: JSON.stringify({ permission }) });
  return data.share;
}

export async function removeCollaborator(taskId: string, userId: string) {
  await authFetch(`/tasks/${taskId}/share/${userId}`, { method: "DELETE" });
}

// Notifications
export async function getNotifications() {
  const data = await authFetch("/notifications");
  return data as { notifications: Notification[]; unreadCount: number };
}

export async function getUnreadCount() {
  const data = await authFetch("/notifications/unread-count");
  return data.count as number;
}

export async function markNotificationRead(id: string) {
  await authFetch(`/notifications/${id}/read`, { method: "POST" });
}

export async function markAllNotificationsRead() {
  await authFetch("/notifications/read-all", { method: "POST" });
}
