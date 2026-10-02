const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

/**
 * Structured API error thrown by all apiClient methods.
 * Consumers can check `error.status` to handle 401/403/429/500 differently.
 */
export class ApiError extends Error {
  status: number;
  /** Server-supplied message (safe — never contains a stack trace). */
  serverMessage: string;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.serverMessage = message;
  }
}

/**
 * Simple event bus so the apiClient (outside React) can signal error toasts
 * to any registered listener (the AppErrorHandler component).
 */
type ErrorListener = (err: ApiError) => void;
const errorListeners: ErrorListener[] = [];

export const apiErrorBus = {
  subscribe(fn: ErrorListener)   { errorListeners.push(fn); },
  unsubscribe(fn: ErrorListener) {
    const idx = errorListeners.indexOf(fn);
    if (idx >= 0) errorListeners.splice(idx, 1);
  },
  emit(err: ApiError) { errorListeners.forEach((fn) => fn(err)); },
};

/**
 * Status codes that should NOT produce an automatic toast — callers handle
 * these inline (e.g. login forms showing "Wrong password" in the form itself).
 */
const SILENT_CODES = new Set([400, 401, 404, 409, 422]);

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('devclash_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('devclash_token', token);
    } else {
      localStorage.removeItem('devclash_token');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    let response: Response;
    try {
      response = await fetch(url, { ...options, headers });
    } catch {
      // Network failure / server unreachable
      const err = new ApiError(0, 'Network error — cannot reach the server. Please check your connection.');
      apiErrorBus.emit(err);
      throw err;
    }

    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      try {
        const body = await response.json();
        message = body.error ?? body.message ?? message;
      } catch { /* ignore JSON parse failure */ }

      const err = new ApiError(response.status, message);

      // Broadcast to global toast handler for non-silent codes
      if (!SILENT_CODES.has(response.status)) {
        apiErrorBus.emit(err);
      }

      throw err;
    }

    if (response.status === 204) return {} as T;
    return response.json() as Promise<T>;
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) });
  }

  put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) });
  }

  patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(data) });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
