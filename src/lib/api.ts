import { useAuthStore } from "../store/useAuthStore";
import { API_BASE, wsUrl } from "./apiBase";

export { API_BASE, wsUrl };

/**
 * Fetch helper for the Gotham Sim backend. Attaches the signed-in user's
 * bearer token (if any) and clears the session on a 401 so RequireAuth
 * bounces back to the login screen.
 */
export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    useAuthStore.getState().logout();
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${path} failed (${res.status}): ${text || res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
