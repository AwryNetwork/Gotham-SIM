import { NavLink } from "react-router-dom";
import { Minus, Square, X, LogOut, UserCircle2 } from "lucide-react";
import { NAV_ITEMS } from "../../lib/navigation";
import { useAuthStore } from "../../store/useAuthStore";

const MENU_ITEMS = ["File", "Edit", "View", "Support"];

const ROLE_COLOR: Record<string, string> = {
  Admin: "text-danger border-danger/40 bg-danger/10",
  Analyst: "text-accent-cyan border-accent-cyan/40 bg-accent-cyan/10",
  Viewer: "text-text-muted border-border bg-bg-elevated",
};

export function TitleBar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex h-9 w-full shrink-0 items-center border-b border-border bg-bg-panel px-2">
      <div className="flex items-center gap-3">
        {MENU_ITEMS.map((item) => (
          <button
            key={item}
            type="button"
            className="rounded px-1.5 py-1 text-xs text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
          >
            {item}
          </button>
        ))}
      </div>

      <div className="flex flex-1 items-center justify-center gap-1 overflow-x-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              [
                "shrink-0 rounded-t px-3 py-1 text-[11px] font-medium tracking-wide transition-colors",
                isActive
                  ? "border-b-2 border-accent-cyan text-accent-cyan"
                  : "border-b-2 border-transparent text-text-secondary hover:text-text-primary",
              ].join(" ")
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {user && (
          <div className="flex items-center gap-1.5">
            <UserCircle2 size={14} className="text-text-muted" />
            <span className="font-mono-data text-[11px] text-text-secondary">{user.username}</span>
            <span
              className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${ROLE_COLOR[user.role]}`}
            >
              {user.role}
            </span>
            <button
              type="button"
              title="Log out"
              onClick={logout}
              className="rounded p-1 text-text-muted hover:bg-bg-elevated hover:text-text-primary"
            >
              <LogOut size={13} />
            </button>
          </div>
        )}
        <div className="mx-1 h-4 w-px bg-border" />
        <button
          type="button"
          aria-label="Minimize"
          className="rounded p-1 text-text-muted hover:bg-bg-elevated hover:text-text-primary"
        >
          <Minus size={13} />
        </button>
        <button
          type="button"
          aria-label="Maximize"
          className="rounded p-1 text-text-muted hover:bg-bg-elevated hover:text-text-primary"
        >
          <Square size={11} />
        </button>
        <button
          type="button"
          aria-label="Close"
          className="rounded p-1 text-text-muted hover:bg-danger/20 hover:text-danger"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
