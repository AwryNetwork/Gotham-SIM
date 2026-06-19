import { useUIStore } from "../store/useUIStore";
import { Globe3D } from "../components/map/Globe3D";
import { Map2D } from "../components/map/Map2D";
import { MapToggle } from "../components/map/MapToggle";
import { TaskAssetPanel } from "../components/panels/TaskAssetPanel";
import { EntityDetailPanel } from "../components/panels/EntityDetailPanel";
import { LiveFeedsPanel } from "../components/panels/LiveFeedsPanel";

export function MapView() {
  const mapMode = useUIStore((s) => s.mapMode);

  return (
    <div className="relative h-full w-full">
      {mapMode === "3d" ? <Globe3D /> : <Map2D />}
      <MapToggle />
      <TaskAssetPanel />
      <EntityDetailPanel />
      <LiveFeedsPanel />
    </div>
  );
}
