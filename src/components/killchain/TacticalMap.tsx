import { useEffect, useRef, useState } from "react";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Compass } from "lucide-react";
import * as turf from "@turf/turf";
import { SIMULATOR_TARGET, SIMULATOR_ASSETS } from "../../data/simulatorAssets";

const STYLE_URL = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const RING_RADII_NM = [40, 90, 150];
const RING_COLORS = ["#ec4899", "#f59e0b", "#22d3ee"];

function buildRangeRings() {
  const features = RING_RADII_NM.map((nm, i) =>
    turf.circle([SIMULATOR_TARGET.lng, SIMULATOR_TARGET.lat], nm * 1.852, {
      units: "kilometers",
      properties: { color: RING_COLORS[i] },
    }),
  );
  return { type: "FeatureCollection" as const, features };
}

function buildFlightPaths() {
  const features = SIMULATOR_ASSETS.map((a) => ({
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates: [
        [a.lng, a.lat],
        [SIMULATOR_TARGET.lng, SIMULATOR_TARGET.lat],
      ],
    },
  }));
  return { type: "FeatureCollection" as const, features };
}

function buildTracks() {
  const target = {
    type: "Feature" as const,
    properties: { label: "TARGET", isTarget: true },
    geometry: { type: "Point" as const, coordinates: [SIMULATOR_TARGET.lng, SIMULATOR_TARGET.lat] },
  };
  const assets = SIMULATOR_ASSETS.map((a) => ({
    type: "Feature" as const,
    properties: { label: a.trackLabel, isTarget: false },
    geometry: { type: "Point" as const, coordinates: [a.lng, a.lat] },
  }));
  return { type: "FeatureCollection" as const, features: [target, ...assets] };
}

const PRIMARY_HEADING = Math.round(
  turf.bearing([SIMULATOR_ASSETS[0].lng, SIMULATOR_ASSETS[0].lat], [SIMULATOR_TARGET.lng, SIMULATOR_TARGET.lat]),
);

export function TacticalMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [SIMULATOR_TARGET.lng, SIMULATOR_TARGET.lat],
      zoom: 5.5,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    map.on("load", () => {
      map.addSource("kc-range-rings", { type: "geojson", data: buildRangeRings() });
      map.addLayer({
        id: "kc-range-rings-line",
        type: "line",
        source: "kc-range-rings",
        paint: { "line-color": ["get", "color"], "line-width": 1.5, "line-opacity": 0.7 },
      });

      map.addSource("kc-flight-paths", { type: "geojson", data: buildFlightPaths() });
      map.addLayer({
        id: "kc-flight-paths-line",
        type: "line",
        source: "kc-flight-paths",
        paint: { "line-color": "#facc15", "line-width": 1, "line-dasharray": [3, 2], "line-opacity": 0.7 },
      });

      map.addSource("kc-tracks", { type: "geojson", data: buildTracks() });
      map.addLayer({
        id: "kc-tracks-point",
        type: "circle",
        source: "kc-tracks",
        paint: {
          "circle-radius": ["case", ["get", "isTarget"], 7, 4],
          "circle-color": ["case", ["get", "isTarget"], "#ec4899", "#22d3ee"],
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#070b12",
        },
      });
      map.addLayer({
        id: "kc-tracks-label",
        type: "symbol",
        source: "kc-tracks",
        layout: {
          "text-field": ["get", "label"],
          "text-size": 10,
          "text-offset": [0, 1.2],
          "text-font": ["Noto Sans Regular"],
        },
        paint: { "text-color": "#e6edf3", "text-halo-color": "#070b12", "text-halo-width": 1 },
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded border border-border bg-bg-panel/90 px-2.5 py-1.5 backdrop-blur">
        <Compass size={13} className="text-accent-cyan" />
        <span className="font-mono-data text-[11px] text-accent-cyan">
          HDG {((PRIMARY_HEADING + 360) % 360).toFixed(0).padStart(3, "0")}°
        </span>
      </div>

      <div className="absolute right-3 top-3 z-10 rounded border border-border bg-bg-panel/90 px-2.5 py-1.5 backdrop-blur">
        <span className="font-mono-data text-[11px] text-text-primary">
          {now.toISOString().slice(11, 19)} UTC
        </span>
      </div>
    </div>
  );
}
