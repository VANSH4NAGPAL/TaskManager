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

async function rawFetch(path: string, options: RequestInit = {}, skipAuth = false) {
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
      // try refresh once
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

export async function signup(input: { name: string; email: string; password: string }) {
  const data = await rawFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
  setAccessToken(data.accessToken);
  return data.user;
}

export async function login(input: { email: string; password: string }) {
  const data = await rawFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
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

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  tags: string[];
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listTasks(params: { q?: string; status?: TaskStatus; tag?: string; due?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.append("q", params.q);
  if (params.status) qs.append("status", params.status);
  if (params.tag) qs.append("tag", params.tag);
  if (params.due) qs.append("due", params.due);
  const search = qs.toString();
  const data = await authFetch(`/tasks${search ? `?${search}` : ""}`);
  return data.tasks as Task[];
}

export async function createTask(input: {
  title: string;
  description: string;
  status?: TaskStatus;
  tags?: string[];
  dueDate?: string | null;
}) {
  const data = await authFetch("/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.task as Task;
}

export async function updateTask(id: string, input: Partial<Omit<Task, "id" | "createdAt" | "updatedAt" | "userId">>) {
  const data = await authFetch(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return data.task as Task;
}

export async function deleteTask(id: string) {
  await authFetch(`/tasks/${id}`, { method: "DELETE" });
}
