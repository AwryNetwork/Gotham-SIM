import { useEffect } from "react";
import type { GeoJSONSource } from "maplibre-gl";
import type { Feature, FeatureCollection, LineString } from "geojson";
import { useLiveRawStore } from "../../store/useLiveRawStore";
import { useUIStore } from "../../store/useUIStore";
import { useMap } from "./MapContext";

const SOURCE_ID = "satellite-ground-tracks";
const LAYER_ID = "satellite-ground-tracks-line";

/**
 * Draws real Celestrak ground tracks as MapLibre line features. Splits each
 * track on antimeridian crossings so lines don't streak across the map.
 */
function splitOnAntimeridian(points: { lat: number; lng: number }[]): number[][][] {
  const segments: number[][][] = [];
  let current: number[][] = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (current.length > 0) {
      const prev = current[current.length - 1];
      if (Math.abs(p.lng - prev[0]) > 180) {
        segments.push(current);
        current = [];
      }
    }
    current.push([p.lng, p.lat]);
  }
  if (current.length > 0) segments.push(current);
  return segments;
}

export function SatelliteGroundTrackLayer() {
  const map = useMap();
  const satellites = useLiveRawStore((s) => s.satellites);
  const satellitesEnabled = useUIStore((s) => s.liveLayers.satellites);

  useEffect(() => {
    if (!map) return;

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: LAYER_ID,
        type: "line",
        source: SOURCE_ID,
        paint: {
          "line-color": "#67e8f9",
          "line-width": 1,
          "line-opacity": 0.5,
          "line-dasharray": [2, 2],
        },
      });
    }

    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    if (!source) return;

    const features: Feature<LineString>[] =
      satellitesEnabled && satellites.length > 0
        ? satellites.flatMap((sat) =>
            splitOnAntimeridian(sat.groundTrack).map((coordinates) => ({
              type: "Feature" as const,
              properties: { name: sat.name },
              geometry: { type: "LineString" as const, coordinates },
            })),
          )
        : [];

    const collection: FeatureCollection<LineString> = { type: "FeatureCollection", features };
    source.setData(collection);
  }, [map, satellites, satellitesEnabled]);

  return null;
}
