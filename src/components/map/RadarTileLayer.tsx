import { useEffect, useMemo } from "react";
import type { RasterTileSource } from "maplibre-gl";
import { useLiveRawStore } from "../../store/useLiveRawStore";
import { useUIStore } from "../../store/useUIStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import { useMap } from "./MapContext";

const SOURCE_ID = "rainviewer-radar";
const LAYER_ID = "rainviewer-radar-tiles";

/** Toggleable RainViewer radar overlay, frame chosen by nearest match to the bottom Timeline scrubber. */
export function RadarTileLayer() {
  const map = useMap();
  const frames = useLiveRawStore((s) => s.radarFrames);
  const enabled = useUIStore((s) => s.liveLayers.radar);
  const currentTime = useTimelineStore((s) => s.currentTime);

  const tileUrl = useMemo(() => {
    if (!frames) return null;
    const all = [...frames.past, ...frames.nowcast];
    if (all.length === 0) return null;
    const targetSec = currentTime / 1000;
    let best = all[0];
    let bestDiff = Math.abs(all[0].time - targetSec);
    for (const f of all) {
      const diff = Math.abs(f.time - targetSec);
      if (diff < bestDiff) {
        best = f;
        bestDiff = diff;
      }
    }
    return `${frames.host}${best.path}/256/{z}/{x}/{y}/4/1_1.png`;
  }, [frames, currentTime]);

  useEffect(() => {
    if (!map) return;

    if (!enabled || !tileUrl) {
      if (map.getLayer(LAYER_ID)) map.setLayoutProperty(LAYER_ID, "visibility", "none");
      return;
    }

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, { type: "raster", tiles: [tileUrl], tileSize: 256 });
      map.addLayer({
        id: LAYER_ID,
        type: "raster",
        source: SOURCE_ID,
        paint: { "raster-opacity": 0.55 },
      });
    } else {
      const source = map.getSource(SOURCE_ID) as RasterTileSource;
      source.setTiles([tileUrl]);
      if (map.getLayer(LAYER_ID)) map.setLayoutProperty(LAYER_ID, "visibility", "visible");
    }
  }, [map, enabled, tileUrl]);

  return null;
}
