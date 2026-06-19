import { useEffect } from "react";
import type { GeoJSONSource } from "maplibre-gl";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import { useLiveRawStore } from "../../store/useLiveRawStore";
import { useUIStore } from "../../store/useUIStore";
import { useMap } from "./MapContext";

const SOURCE_ID = "nws-weather-alerts";
const FILL_LAYER_ID = "nws-weather-alerts-fill";
const LINE_LAYER_ID = "nws-weather-alerts-line";

const SEVERITY_COLOR: Record<string, string> = {
  Extreme: "#ec4899",
  Severe: "#f59e0b",
  Moderate: "#3b82f6",
  Minor: "#5a6675",
};

function colorFor(severity: string): string {
  return SEVERITY_COLOR[severity] ?? "#3b82f6";
}

export function WeatherAlertsLayer() {
  const map = useMap();
  const alerts = useLiveRawStore((s) => s.weatherAlerts);
  const enabled = useUIStore((s) => s.liveLayers.weatherAlerts);

  useEffect(() => {
    if (!map) return;

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: FILL_LAYER_ID,
        type: "fill",
        source: SOURCE_ID,
        paint: { "fill-color": ["get", "color"], "fill-opacity": 0.12 },
      });
      map.addLayer({
        id: LINE_LAYER_ID,
        type: "line",
        source: SOURCE_ID,
        paint: { "line-color": ["get", "color"], "line-width": 1.5, "line-opacity": 0.6 },
      });
    }

    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    if (!source) return;

    const features: Feature<Polygon>[] =
      enabled && alerts.length > 0
        ? alerts.map((a) => ({
            type: "Feature" as const,
            properties: {
              color: colorFor(a.severity),
              event: a.event,
              headline: a.headline,
              areaDesc: a.areaDesc,
            },
            geometry: { type: "Polygon" as const, coordinates: a.polygon },
          }))
        : [];

    const collection: FeatureCollection<Polygon> = { type: "FeatureCollection", features };
    source.setData(collection);
  }, [map, alerts, enabled]);

  return null;
}
