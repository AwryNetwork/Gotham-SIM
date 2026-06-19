import { useState } from "react";
import { Smartphone, Map as MapIcon, ChevronUp, ChevronDown } from "lucide-react";
import { Map2D } from "../components/map/Map2D";
import { EntityDetailPanel } from "../components/panels/EntityDetailPanel";
import { ArDrop } from "../components/field/ArDrop";

export function FieldView() {
  const [arOpen, setArOpen] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-bg-panel px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Smartphone size={14} className="text-warning" />
          <span className="text-xs font-semibold uppercase tracking-wide text-warning">Field Mode</span>
        </div>
        <span className="text-[10px] text-text-muted">Mobile-responsive (optional)</span>
      </div>

      <div className="relative flex-1">
        <Map2D />
        <EntityDetailPanel />
      </div>

      <button
        type="button"
        onClick={() => setArOpen((v) => !v)}
        className="flex items-center justify-center gap-1.5 border-t border-border bg-bg-panel py-2.5 text-xs font-semibold text-accent-cyan"
      >
        <MapIcon size={13} />
        AR Drop Marker (optional)
        {arOpen ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
      </button>

      {arOpen && (
        <div className="max-h-[60vh] overflow-y-auto border-t border-border p-3">
          <ArDrop />
        </div>
      )}
    </div>
  );
}
