import { useState } from "react";
import { Link } from "react-router-dom";
import { Smartphone } from "lucide-react";
import { ViewHeader } from "../components/shell/ViewHeader";

interface ToggleRowProps {
  label: string;
  description: string;
  defaultChecked?: boolean;
}

function ToggleRow({ label, description, defaultChecked }: ToggleRowProps) {
  const [checked, setChecked] = useState(!!defaultChecked);
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-3">
      <div>
        <div className="text-sm text-text-primary">{label}</div>
        <div className="text-xs text-text-muted">{description}</div>
      </div>
      <button
        type="button"
        onClick={() => setChecked((c) => !c)}
        className={[
          "h-5 w-9 rounded-full transition-colors",
          checked ? "bg-accent-cyan/60" : "bg-bg-elevated",
        ].join(" ")}
      >
        <span
          className={[
            "block h-4 w-4 translate-y-0.5 rounded-full bg-text-primary transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

export function SettingsView() {
  return (
    <div className="flex h-full flex-col">
      <ViewHeader title="Settings" subtitle="Local simulator preferences" />
      <div className="max-w-xl flex-1 overflow-auto p-5">
        <div className="label-section mb-2">Display</div>
        <ToggleRow
          label="Dark tactical theme"
          description="Locked for this simulator build"
          defaultChecked
        />
        <ToggleRow
          label="Show classification banners"
          description="Display UNCLASSIFIED // NOTIONAL DATA strips"
          defaultChecked
        />
        <ToggleRow
          label="Coordinate readout in mono font"
          description="Use JetBrains Mono for numeric data"
          defaultChecked
        />

        <div className="label-section mb-2 mt-6">Simulation</div>
        <ToggleRow
          label="Auto-play timeline"
          description="Resume playback when the app loads"
        />
        <ToggleRow
          label="Lost-contact alerts"
          description="Flag entities with stale notional telemetry"
          defaultChecked
        />

        <div className="label-section mb-2 mt-6">Optional / Demo</div>
        <Link
          to="/field"
          className="flex items-center gap-2 rounded border border-border bg-bg-panel px-3 py-2.5 text-xs text-text-secondary hover:border-accent-cyan/40 hover:text-text-primary"
        >
          <Smartphone size={14} className="text-warning" />
          Field Mode — mobile-responsive map + AR marker demo
        </Link>
      </div>
    </div>
  );
}
