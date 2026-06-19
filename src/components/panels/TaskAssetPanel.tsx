import { useState } from "react";
import { Loader2, MapPin, Clock } from "lucide-react";
import taskData from "../../data/taskAssets.json";

const TABS = ["Unmanned aircraft", "Planes", "Satellite"] as const;
type Tab = (typeof TABS)[number];

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

export function TaskAssetPanel() {
  const [tab, setTab] = useState<Tab>("Satellite");

  return (
    <div className="absolute left-4 top-4 z-10 flex w-80 flex-col rounded border border-border bg-bg-panel/95 backdrop-blur">
      <div className="border-b border-border px-3 py-2.5">
        <span className="label-section">Task Asset</span>
      </div>

      <div className="flex border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={[
              "flex-1 px-2 py-2 text-[10.5px] font-medium transition-colors",
              tab === t
                ? "border-b-2 border-accent-cyan text-accent-cyan"
                : "border-b-2 border-transparent text-text-secondary hover:text-text-primary",
            ].join(" ")}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 p-3">
        <div className="flex items-start gap-2 rounded border border-accent-cyan/30 bg-accent-cyan/5 p-2.5">
          <Loader2 size={14} className="mt-0.5 shrink-0 animate-spin text-accent-cyan" />
          <p className="text-[11px] leading-snug text-text-secondary">
            {taskData.statusMessage}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <MapPin size={13} className="text-text-muted" />
          <span className="font-mono-data">{taskData.location}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Clock size={13} className="text-text-muted" />
          <span className="font-mono-data">
            {formatTime(taskData.windowStart)} – {formatTime(taskData.windowEnd)} UTC
          </span>
        </div>

        <div>
          <div className="label-section mb-1.5">Available satellites</div>
          <div className="flex flex-col gap-1.5">
            {taskData.availableSatellites.map((sat) => (
              <div
                key={sat.id}
                className="flex items-center justify-between rounded border border-border bg-bg-elevated px-2.5 py-1.5"
              >
                <span className="text-xs text-text-primary">{sat.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono-data text-[10px] text-text-muted">
                    {sat.hoursToRange}h to range
                  </span>
                  <span
                    className={[
                      "rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                      sat.available
                        ? "bg-success/15 text-success"
                        : "bg-text-muted/15 text-text-muted",
                    ].join(" ")}
                  >
                    {sat.available ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mt-2 text-[11px] text-accent-cyan hover:underline"
          >
            See all satellites
          </button>
        </div>

        <button
          type="button"
          className="mt-1 rounded bg-accent-teal/15 py-2 text-xs font-semibold text-accent-teal ring-1 ring-accent-teal/40 transition-colors hover:bg-accent-teal/25"
        >
          Choose models →
        </button>
      </div>
    </div>
  );
}
