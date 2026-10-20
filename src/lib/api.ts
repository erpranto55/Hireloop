import { authClient } from "./auth-client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" ? "http://localhost:5001" : "http://localhost:5001");

export interface ApiFetchOptions extends RequestInit {
  token?: string;
}

/**
 * Robust fetch wrapper for HireLoop backend API.
 * Ensures credentials and Bearer authorization tokens are included.
 */
export async function apiFetch<T = any>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // If token is explicitly passed, use it
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  } else if (!headers.has("Authorization") && typeof window !== "undefined") {
    // Attempt to retrieve token from better-auth client session cache
    try {
      const session = await authClient.getSession();
      if (session?.data?.session?.token) {
        headers.set("Authorization", `Bearer ${session.data.session.token}`);
      }
    } catch {
      // Session retrieval failed; cookie will still be sent via credentials: "include"
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: options.credentials || "include",
  });

  let data: any = null;
  if (res.status !== 204) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    let errorMessage = `Request failed with status ${res.status}`;
    if (data?.message) errorMessage = data.message;
    else if (data?.error) errorMessage = data.error;

    const error = new Error(errorMessage) as Error & { status: number; data?: any; ok: boolean; json: () => Promise<any> };
    error.status = res.status;
    error.data = data;
    error.ok = false;
    error.json = async () => data;
    throw error;
  }

  if (res.status === 204 || data === null) {
    return null as T;
  }

  if (data && typeof data === "object") {
    try {
      Object.defineProperty(data, "ok", { value: true, enumerable: false, configurable: true, writable: true });
      Object.defineProperty(data, "status", { value: res.status, enumerable: false, configurable: true, writable: true });
      Object.defineProperty(data, "json", { value: async () => data, enumerable: false, configurable: true, writable: true });
    } catch {
      // Ignore if object is frozen
    }
  }

  return data as T;
}
