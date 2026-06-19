import { ViewHeader } from "../components/shell/ViewHeader";
import { useObjectStore, useVisibleEntities } from "../store/useObjectStore";
import { ENTITY_COLOR, ENTITY_LABEL } from "../lib/entityVisuals";

export function HistoryView() {
  const entities = useVisibleEntities();
  const setSelection = useObjectStore((s) => s.setSelection);
  const events = [...entities]
    .sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime())
    .slice(0, 80);

  return (
    <div className="flex h-full flex-col">
      <ViewHeader
        title="History"
        subtitle="Chronological log of notional entity updates (most recent 80)"
      />
      <div className="flex-1 overflow-auto p-4">
        <div className="relative ml-3 border-l border-border pl-6">
          {events.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setSelection([e.id])}
              className="relative mb-5 block w-full text-left"
            >
              <span
                className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full ring-2 ring-bg-base"
                style={{ backgroundColor: ENTITY_COLOR[e.type] }}
              />
              <div className="font-mono-data text-[11px] text-accent-cyan">
                {new Date(e.lastUpdate).toISOString().slice(0, 16).replace("T", " ")}{" "}
                UTC
              </div>
              <div className="text-sm text-text-primary">
                <span className="font-medium">{e.name}</span>{" "}
                <span className="text-text-secondary">
                  — {ENTITY_LABEL[e.type]} ({e.category}) status updated
                </span>
              </div>
              <p className="text-xs text-text-muted">{e.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
