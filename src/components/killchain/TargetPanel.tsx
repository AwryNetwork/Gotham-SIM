import { Crosshair, MapPin } from "lucide-react";
import { SIMULATOR_TARGET } from "../../data/simulatorAssets";

export function TargetPanel() {
  return (
    <div className="flex flex-col border-b border-border">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <span className="label-section">Target</span>
        <span className="rounded bg-danger/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-danger">
          {SIMULATOR_TARGET.priorityTag}
        </span>
      </div>

      <div className="flex items-start gap-2 px-3 py-2.5">
        <Crosshair size={14} className="mt-0.5 shrink-0 text-accent-cyan" />
        <div className="text-xs leading-snug text-text-primary">{SIMULATOR_TARGET.name}</div>
      </div>

      <div className="px-3 pb-2.5">
        <div className="label-section mb-1.5">Aimpoints ({SIMULATOR_TARGET.aimpoints.length})</div>
        <div className="flex flex-col gap-1">
          {SIMULATOR_TARGET.aimpoints.map((ap) => (
            <div key={ap.id} className="flex items-center gap-1.5 rounded border border-border bg-bg-elevated px-2 py-1.5">
              <MapPin size={11} className="shrink-0 text-text-muted" />
              <div className="min-w-0">
                <div className="truncate text-[10.5px] text-text-secondary">{ap.label}</div>
                <div className="font-mono-data text-[10px] text-accent-cyan">{ap.coordinate}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border px-3 py-2">
        <span className="label-section">Tasking Queue</span>
      </div>
    </div>
  );
}
