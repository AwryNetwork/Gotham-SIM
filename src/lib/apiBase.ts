export const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8787";

export function wsUrl(path: string): string {
  return `${API_BASE.replace(/^http/, "ws")}${path}`;
}
