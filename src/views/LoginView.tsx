import { useState, type FormEvent } from "react";
import { Lock, ShieldAlert } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

const DEMO_LOGINS = [
  { username: "admin", password: "admin123", role: "Admin" },
  { username: "analyst", password: "analyst123", role: "Analyst" },
  { username: "viewer", password: "viewer123", role: "Viewer" },
];

export function LoginView() {
  const login = useAuthStore((s) => s.login);
  const error = useAuthStore((s) => s.error);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(username, password);
    } catch {
      // error surfaced via store
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-bg-base">
      <div className="w-full max-w-sm rounded border border-border bg-bg-panel">
        <div className="flex items-center gap-0.5 justify-center border-b border-border bg-class-green py-1">
          <span className="text-[10px] font-bold tracking-[0.15em] text-black">
            UNCLASSIFIED // OPEN-SOURCE DATA
          </span>
        </div>

        <div className="flex flex-col items-center gap-1 px-6 pt-6">
          <div className="flex h-10 w-10 items-center justify-center rounded border border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan">
            <Lock size={18} />
          </div>
          <div className="mt-2 text-sm font-semibold tracking-wide text-text-primary">
            GOTHAM SIM
          </div>
          <div className="text-[11px] text-text-muted">
            Sign in to access the tactical dashboard
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-6 py-5">
          <div>
            <div className="label-section mb-1">Username</div>
            <input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-accent-cyan/50 focus:outline-none"
              placeholder="admin"
            />
          </div>
          <div>
            <div className="label-section mb-1">Password</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-accent-cyan/50 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="flex items-start gap-1.5 rounded border border-danger/40 bg-danger/10 px-2.5 py-2 text-[11px] text-danger">
              <ShieldAlert size={13} className="mt-0.5 shrink-0" />
              <span>{error}. Is the backend running on port 8787?</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !username || !password}
            className="mt-1 rounded bg-accent-cyan/15 py-2 text-xs font-semibold text-accent-cyan ring-1 ring-accent-cyan/40 transition-colors hover:bg-accent-cyan/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="border-t border-border px-6 py-3">
          <div className="label-section mb-1.5">Demo credentials</div>
          <div className="flex flex-col gap-1">
            {DEMO_LOGINS.map((d) => (
              <button
                key={d.username}
                type="button"
                onClick={() => {
                  setUsername(d.username);
                  setPassword(d.password);
                }}
                className="flex items-center justify-between rounded border border-border bg-bg-elevated px-2.5 py-1.5 text-left text-[11px] text-text-secondary hover:border-accent-cyan/40 hover:text-text-primary"
              >
                <span className="font-mono-data">
                  {d.username} / {d.password}
                </span>
                <span className="text-[9px] uppercase tracking-wide text-text-muted">
                  {d.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
