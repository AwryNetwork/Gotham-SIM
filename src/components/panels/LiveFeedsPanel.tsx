import { Plane, Ship, Satellite as SatelliteIcon, Waves, Flame, CloudLightning, CloudRain, Camera, Newspaper, Database } from "lucide-react";
import { useUIStore, type LiveLayerToggles } from "../../store/useUIStore";
import { useObjectStore } from "../../store/useObjectStore";
import { useNowTick, secondsAgo } from "../../hooks/usePolling";

interface LayerRow {
  key: keyof LiveLayerToggles;
  label: string;
  source: string;
  icon: typeof Plane;
  optional?: boolean;
}

const LAYER_ROWS: LayerRow[] = [
  { key: "aircraft", label: "Aircraft", source: "OpenSky Network", icon: Plane },
  { key: "ships", label: "Ships", source: "AISStream.io", icon: Ship },
  { key: "satellites", label: "Satellites", source: "Celestrak", icon: SatelliteIcon },
  { key: "earthquakes", label: "Earthquakes", source: "USGS", icon: Waves },
  { key: "events", label: "Natural Events", source: "NASA EONET", icon: Flame },
  { key: "weatherAlerts", label: "Weather Alerts", source: "NOAA/NWS", icon: CloudLightning },
  { key: "radar", label: "Weather Radar", source: "RainViewer", icon: CloudRain },
  { key: "cameras", label: "Traffic Cameras", source: "VDOT 511", icon: Camera },
  { key: "osint", label: "OSINT Events (unverified)", source: "GDELT", icon: Newspaper, optional: true },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={["h-4 w-7 shrink-0 rounded-full transition-colors", checked ? "bg-accent-cyan/60" : "bg-bg-elevated"].join(" ")}
    >
      <span
        className={["block h-3 w-3 translate-y-0.5 rounded-full bg-text-primary transition-transform", checked ? "translate-x-[14px]" : "translate-x-0.5"].join(" ")}
      />
    </button>
  );
}

export function LiveFeedsPanel() {
  const liveFeedsPanelOpen = useUIStore((s) => s.liveFeedsPanelOpen);
  const liveLayers = useUIStore((s) => s.liveLayers);
  const toggleLiveLayer = useUIStore((s) => s.toggleLiveLayer);
  const liveFeedStatus = useUIStore((s) => s.liveFeedStatus);
  const sampleDatasetEnabled = useObjectStore((s) => s.sampleDatasetEnabled);
  const setSampleDatasetEnabled = useObjectStore((s) => s.setSampleDatasetEnabled);
  const now = useNowTick();

  if (!liveFeedsPanelOpen) return null;

  return (
    <div className="absolute left-4 bottom-4 z-10 flex max-h-[60vh] w-72 flex-col overflow-hidden rounded border border-border bg-bg-panel/95 backdrop-blur">
      <div className="border-b border-border px-3 py-2.5">
        <span className="label-section">Live Feeds</span>
      </div>

      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <Database size={13} className="text-text-muted" />
          <span className="text-xs text-text-secondary">Sample dataset</span>
        </div>
        <Toggle checked={sampleDatasetEnabled} onChange={() => setSampleDatasetEnabled(!sampleDatasetEnabled)} />
      </div>

      <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {LAYER_ROWS.map((row) => {
          const Icon = row.icon;
          const enabled = liveLayers[row.key];
          const status = liveFeedStatus[row.key];
          const hasError = !!status?.error;
          return (
            <div key={row.key} className="flex items-center justify-between rounded px-1.5 py-1.5 hover:bg-bg-elevated">
              <div className="flex items-center gap-2">
                <Icon size={13} className="text-text-muted" />
                <div>
                  <div className="text-xs text-text-primary">{row.label}</div>
                  <div className="flex items-center gap-1 text-[9px] uppercase tracking-wide">
                    {enabled && !hasError && (
                      <span className="text-accent-cyan">
                        LIVE &bull; {row.source} &bull; updated {secondsAgo(status?.lastUpdatedAt ?? null, now)}
                      </span>
                    )}
                    {enabled && hasError && <span className="text-danger">ERROR &bull; {status?.error}</span>}
                    {!enabled && <span className="text-text-muted">OFF &bull; {row.source}{row.optional ? " (optional)" : ""}</span>}
                  </div>
                </div>
              </div>
              <Toggle checked={enabled} onChange={() => toggleLiveLayer(row.key)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
