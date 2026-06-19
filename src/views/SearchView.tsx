import { useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { useObjectStore, useVisibleEntities } from "../store/useObjectStore";
import { ENTITY_COLOR, ENTITY_LABEL } from "../lib/entityVisuals";
import { ViewHeader } from "../components/shell/ViewHeader";

export function SearchView() {
  const entities = useVisibleEntities();
  const setSelection = useObjectStore((s) => s.setSelection);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entities;
    return entities.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.affiliation.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q),
    );
  }, [entities, query]);

  return (
    <div className="flex h-full flex-col">
      <ViewHeader
        title="Search"
        subtitle="Query notional entities by name, type, category, or affiliation"
      />
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-2 rounded border border-border bg-bg-panel px-3 py-2">
          <SearchIcon size={14} className="text-text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search entities..."
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="label-section mb-2">
          {results.length} result{results.length === 1 ? "" : "s"}
        </div>
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
          {results.slice(0, 120).map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setSelection([e.id])}
              className="rounded border border-border bg-bg-panel p-3 text-left hover:border-accent-cyan/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">
                  {e.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className={`rounded border px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wide ${
                      e.source === "live"
                        ? "border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan"
                        : "border-border bg-bg-elevated text-text-muted"
                    }`}
                  >
                    {e.source}
                  </span>
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: ENTITY_COLOR[e.type] }}
                  >
                    {ENTITY_LABEL[e.type]}
                  </span>
                </span>
              </div>
              <p className="mt-1 text-xs text-text-secondary">
                {e.affiliation} &middot; {e.category}
              </p>
              {e.lat !== undefined && e.lng !== undefined && (
                <p className="font-mono-data mt-1 text-[11px] text-text-muted">
                  {e.lat.toFixed(2)}, {e.lng.toFixed(2)}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
