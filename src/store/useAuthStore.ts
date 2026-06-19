import { create } from "zustand";
import { persist } from "zustand/middleware";
import { API_BASE } from "../lib/apiBase";

export type Role = "Admin" | "Analyst" | "Viewer";

export interface AuthUser {
  username: string;
  role: Role;
  clearance: 1 | 2 | 3;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  status: "idle" | "checking" | "ready";
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      status: "idle",
      error: null,

      login: async (username, password) => {
        set({ error: null });
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          const message = data.error || "Login failed";
          set({ error: message });
          throw new Error(message);
        }
        set({ token: data.token, user: data.user, status: "ready", error: null });
      },

      logout: () => set({ token: null, user: null, status: "ready" }),

      hydrate: async () => {
        const token = get().token;
        if (!token) {
          set({ status: "ready" });
          return;
        }
        set({ status: "checking" });
        try {
          const res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("invalid session");
          const data = await res.json();
          set({
            user: {
              username: data.user.sub,
              role: data.user.role,
              clearance: data.user.clearance,
            },
            status: "ready",
          });
        } catch {
          set({ token: null, user: null, status: "ready" });
        }
      },
    }),
    {
      name: "gotham-sim-auth",
      partialize: (s) => ({ token: s.token, user: s.user }),
    },
  ),
);
