import { User, FileItem, DownloadLog, AdminStats } from '../types';

const TOKEN_KEY = 'dockworldwide_jwt_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}`;
    let errorCode = '';
    let status = '';

    if (isJson) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        errorCode = errorData.code || '';
        status = errorData.status || '';
      } catch {
        // ignore parse error
      }
    } else {
      const text = await response.text();
      if (text) errorMessage = text;
    }

    const err = new Error(errorMessage) as Error & { code?: string; status?: string; httpStatus?: number };
    err.code = errorCode;
    err.status = status;
    err.httpStatus = response.status;
    throw err;
  }

  if (isJson) {
    return response.json();
  }

  return response.text() as unknown as T;
}

// Auth API
export async function registerUser(email: string, password?: string, confirmPassword?: string) {
  const data = await request<{ user: User; token: string; message: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, confirmPassword }),
  });
  setStoredToken(data.token);
  return data;
}

export async function loginUser(email: string, password?: string) {
  const data = await request<{ user: User; token: string; redirectUrl: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setStoredToken(data.token);
  return data;
}

export async function loginAdmin(username: string, password: string) {
  const data = await request<{ user: User; token: string; redirectUrl: string }>('/api/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setStoredToken(data.token);
  return data;
}

export async function fetchCurrentUser() {
  const data = await request<{ user: User }>('/api/auth/me');
  return data.user;
}

export async function logoutUser() {
  try {
    await request('/api/auth/logout', { method: 'POST' });
  } catch {
    // ignore
  } finally {
    setStoredToken(null);
  }
}

// User Files API
export async function fetchAvailableFiles() {
  const data = await request<{ files: FileItem[] }>('/api/files');
  return data.files;
}

export async function fetchFileDetails(id: string) {
  const data = await request<{ file: FileItem }>(`/api/files/${id}`);
  return data.file;
}

export async function verifyFilePassword(fileId: string, password: string) {
  return request<{
    success: boolean;
    downloadToken: string;
    downloadUrl: string;
    message?: string;
  }>(`/api/files/${fileId}/verify-password`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

// Helper to trigger a secure file download as a blob
export async function downloadFileStream(fileId: string, filename: string, token?: string) {
  const authToken = getStoredToken();
  const url = token ? `/api/files/${fileId}/download?token=${encodeURIComponent(token)}` : `/api/files/${fileId}/download`;

  const headers: Record<string, string> = {};
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to download file.');
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(downloadUrl);
}

// Admin API
export async function fetchAdminStats() {
  const data = await request<{ stats: AdminStats }>('/api/admin/stats');
  return data.stats;
}

export async function fetchAdminUsers(query = '', status = 'all') {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (status && status !== 'all') params.set('status', status);
  const data = await request<{ users: User[] }>(`/api/admin/users?${params.toString()}`);
  return data.users;
}

export async function updateAdminUserStatus(userId: string, status: User['approval_status']) {
  return request<{ message: string; user: User }>(`/api/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deleteAdminUser(userId: string) {
  return request<{ message: string }>(`/api/admin/users/${userId}`, {
    method: 'DELETE',
  });
}

export async function fetchAdminFiles() {
  const data = await request<{ files: FileItem[] }>('/api/admin/files');
  return data.files;
}

export async function uploadAdminFile(formData: FormData) {
  return request<{ message: string; file: FileItem }>('/api/admin/files/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function updateAdminFile(
  fileId: string,
  payload: {
    title?: string;
    description?: string;
    password?: string;
    removePassword?: boolean;
    is_active?: boolean;
  }
) {
  return request<{ message: string; file: FileItem }>(`/api/admin/files/${fileId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function replaceAdminFile(fileId: string, formData: FormData) {
  return request<{ message: string; file: FileItem }>(`/api/admin/files/${fileId}/replace`, {
    method: 'POST',
    body: formData,
  });
}

export async function deleteAdminFile(fileId: string) {
  return request<{ message: string }>(`/api/admin/files/${fileId}`, {
    method: 'DELETE',
  });
}

export async function fetchAdminLogs() {
  const data = await request<{ logs: DownloadLog[] }>('/api/admin/logs');
  return data.logs;
}

// Utility: Format File Size
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
