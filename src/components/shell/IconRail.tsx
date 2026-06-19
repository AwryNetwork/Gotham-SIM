import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "../../lib/navigation";

export function IconRail() {
  return (
    <nav className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-border bg-bg-panel py-3">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            title={item.label}
            className={({ isActive }) =>
              [
                "flex h-10 w-10 items-center justify-center rounded-md transition-colors",
                isActive
                  ? "bg-accent-cyan/10 text-accent-cyan ring-1 ring-accent-cyan/40"
                  : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary",
              ].join(" ")
            }
          >
            <Icon size={18} strokeWidth={1.75} />
          </NavLink>
        );
      })}
    </nav>
  );
}
