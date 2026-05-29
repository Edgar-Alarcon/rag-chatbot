const API_BASE = import.meta.env.VITE_API_URL || 'https://ragapi.service.edvantage.dev';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface FileRecord {
  id: string;
  project_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  chunk_count: number;
  status: string;
  created_at: string;
}

export interface Message {
  id: string;
  project_id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: { text: string; fileId: string; score: number }[] | null;
  created_at: string;
}

export interface ChatResponse {
  answer: string;
  sources: { text: string; fileId: string; score: number }[];
}

export const api = {
  listProjects: () => request<Project[]>('/api/projects'),
  createProject: (name: string, description?: string) =>
    request<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),
  getProject: (id: string) => request<Project>(`/api/projects/${id}`),
  deleteProject: (id: string) =>
    request<void>(`/api/projects/${id}`, { method: 'DELETE' }),

  listFiles: (projectId: string) => request<FileRecord[]>(`/api/projects/${projectId}/files`),
  uploadFile: (projectId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{ id: string; status: string; original_name: string }>(
      `/api/projects/${projectId}/files`,
      { method: 'POST', body: form },
    );
  },
  deleteFile: (fileId: string) =>
    request<void>(`/api/files/${fileId}`, { method: 'DELETE' }),

  chat: (projectId: string, message: string) =>
    request<ChatResponse>(`/api/projects/${projectId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
  getMessages: (projectId: string) => request<Message[]>(`/api/projects/${projectId}/messages`),
};
