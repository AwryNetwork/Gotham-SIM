import { Globe2, Map as MapIcon, Camera, Satellite } from "lucide-react";
import { useUIStore } from "../../store/useUIStore";

export function MapToggle() {
  const { mapMode, setMapMode, camerasVisible, toggleCameras, liveFeedsPanelOpen, toggleLiveFeedsPanel } =
    useUIStore();

  return (
    <div className="absolute right-4 top-4 z-10 flex overflow-hidden rounded border border-border bg-bg-panel/90 backdrop-blur">
      <button
        type="button"
        onClick={() => setMapMode("3d")}
        className={[
          "flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-colors",
          mapMode === "3d"
            ? "bg-accent-cyan/15 text-accent-cyan"
            : "text-text-secondary hover:text-text-primary",
        ].join(" ")}
      >
        <Globe2 size={13} /> 3D Globe
      </button>
      <button
        type="button"
        onClick={() => setMapMode("2d")}
        className={[
          "flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-colors",
          mapMode === "2d"
            ? "bg-accent-cyan/15 text-accent-cyan"
            : "text-text-secondary hover:text-text-primary",
        ].join(" ")}
      >
        <MapIcon size={13} /> 2D Map
      </button>
      <button
        type="button"
        onClick={toggleCameras}
        title="Toggle traffic camera layer"
        className={[
          "flex items-center gap-1.5 border-l border-border px-3 py-1.5 text-[11px] font-medium transition-colors",
          camerasVisible
            ? "bg-warning/15 text-warning"
            : "text-text-secondary hover:text-text-primary",
        ].join(" ")}
      >
        <Camera size={13} /> Cameras
      </button>
      <button
        type="button"
        onClick={toggleLiveFeedsPanel}
        title="Toggle Live Feeds panel"
        className={[
          "flex items-center gap-1.5 border-l border-border px-3 py-1.5 text-[11px] font-medium transition-colors",
          liveFeedsPanelOpen
            ? "bg-accent-teal/15 text-accent-teal"
            : "text-text-secondary hover:text-text-primary",
        ].join(" ")}
      >
        <Satellite size={13} /> Live Feeds
      </button>
    </div>
  );
}
