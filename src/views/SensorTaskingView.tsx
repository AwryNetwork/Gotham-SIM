import { useEffect, useRef, useState } from "react";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Radar, Send, Loader2 } from "lucide-react";
import { ViewHeader } from "../components/shell/ViewHeader";
import { apiFetch } from "../lib/api";
import { useAuthStore } from "../store/useAuthStore";
import { useLiveRawStore } from "../store/useLiveRawStore";

interface SatellitePass {
  noradId: string;
  name: string;
  start: string;
  end: string;
}

function isoNow(offsetMs = 0) {
  return new Date(Date.now() + offsetMs).toISOString().slice(0, 16);
}

function PreviewMap({ lat, lng, highlightedNoradIds }: { lat: number; lng: number; highlightedNoradIds: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const satellites = useLiveRawStore((s) => s.satellites);

  useEffect(() => {
    if (!containerRef.current) return;
    const instance = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [lng, lat],
      zoom: 2.5,
      attributionControl: { compact: true },
    });
    instance.on("load", () => setMap(instance));
    mapRef.current = instance;
    return () => {
      instance.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!map) return;
    map.setCenter([lng, lat]);

    const targetData = {
      type: "FeatureCollection" as const,
      features: [{ type: "Feature" as const, properties: {}, geometry: { type: "Point" as const, coordinates: [lng, lat] } }],
    };
    if (!map.getSource("target")) {
      map.addSource("target", { type: "geojson", data: targetData });
      map.addLayer({
        id: "target-point",
        type: "circle",
        source: "target",
        paint: { "circle-radius": 7, "circle-color": "#ec4899", "circle-stroke-width": 1.5, "circle-stroke-color": "#070b12" },
      });
    } else {
      (map.getSource("target") as maplibregl.GeoJSONSource).setData(targetData);
    }

    const highlighted = satellites.filter((s) => highlightedNoradIds.includes(s.noradId));
    const trackData = {
      type: "FeatureCollection" as const,
      features: highlighted.map((s) => ({
        type: "Feature" as const,
        properties: { name: s.name },
        geometry: { type: "LineString" as const, coordinates: s.groundTrack.map((p) => [p.lng, p.lat]) },
      })),
    };
    if (!map.getSource("tracks")) {
      map.addSource("tracks", { type: "geojson", data: trackData });
      map.addLayer({
        id: "tracks-line",
        type: "line",
        source: "tracks",
        paint: { "line-color": "#67e8f9", "line-width": 1.5, "line-opacity": 0.7, "line-dasharray": [2, 2] },
      });
    } else {
      (map.getSource("tracks") as maplibregl.GeoJSONSource).setData(trackData);
    }
  }, [map, lat, lng, satellites, highlightedNoradIds]);

  return <div ref={containerRef} className="h-full w-full" />;
}

export function SensorTaskingView() {
  const role = useAuthStore((s) => s.user?.role);
  const canTask = role === "Admin" || role === "Analyst";

  const [lat, setLat] = useState("38.9");
  const [lng, setLng] = useState("-77.0");
  const [start, setStart] = useState(isoNow());
  const [end, setEnd] = useState(isoNow(6 * 60 * 60_000));
  const [passes, setPasses] = useState<SatellitePass[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskedIds, setTaskedIds] = useState<Set<string>>(new Set());

  const predictPasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        lat,
        lng,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
      });
      const res = await apiFetch<{ count: number; passes: SatellitePass[] }>(
        `/api/feeds/satellite-passes?${params}`,
      );
      setPasses(res.passes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  const taskSatellite = async (pass: SatellitePass) => {
    try {
      await apiFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          type: "satellite-imaging-request-mock",
          payload: { ...pass, lat: Number(lat), lng: Number(lng) },
        }),
      });
      setTaskedIds((prev) => new Set(prev).add(`${pass.noradId}-${pass.start}`));
    } catch {
      // surfaced implicitly by button staying untasked
    }
  };

  return (
    <div className="flex h-full flex-col">
      <ViewHeader
        title="Sensor & Satellite Tasking"
        subtitle="Predicts REAL public Celestrak satellite passes — tasking only creates a mock imaging-request entry"
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-96 shrink-0 flex-col gap-3 overflow-y-auto border-r border-border bg-bg-panel p-3">
          <div className="rounded border border-warning/30 bg-warning/5 px-2.5 py-2 text-[11px] leading-snug text-text-secondary">
            This panel visualizes real public satellite orbit data (Celestrak
            TLEs via satellite.js on the backend). Tasking a pass below only
            creates a mock entry in the tasking queue — it cannot control any
            real satellite.
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="label-section mb-1">Target Lat</div>
              <input
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="font-mono-data w-full rounded border border-border bg-bg-elevated px-2 py-1.5 text-xs text-text-primary"
              />
            </div>
            <div>
              <div className="label-section mb-1">Target Lng</div>
              <input
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="font-mono-data w-full rounded border border-border bg-bg-elevated px-2 py-1.5 text-xs text-text-primary"
              />
            </div>
            <div>
              <div className="label-section mb-1">Window Start</div>
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="font-mono-data w-full rounded border border-border bg-bg-elevated px-2 py-1.5 text-[11px] text-text-primary"
              />
            </div>
            <div>
              <div className="label-section mb-1">Window End</div>
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="font-mono-data w-full rounded border border-border bg-bg-elevated px-2 py-1.5 text-[11px] text-text-primary"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={predictPasses}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 rounded bg-accent-cyan/15 py-2 text-xs font-semibold text-accent-cyan ring-1 ring-accent-cyan/40 hover:bg-accent-cyan/25 disabled:opacity-40"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Radar size={13} />}
            Predict Passes
          </button>

          {error && <p className="text-[11px] text-danger">{error}</p>}

          <div className="flex flex-col gap-1.5">
            {passes.map((p) => {
              const key = `${p.noradId}-${p.start}`;
              const tasked = taskedIds.has(key);
              return (
                <div key={key} className="flex items-center justify-between rounded border border-border bg-bg-elevated px-2.5 py-1.5">
                  <div>
                    <div className="text-xs text-text-primary">{p.name}</div>
                    <div className="font-mono-data text-[10px] text-text-muted">
                      {new Date(p.start).toISOString().slice(11, 16)}–{new Date(p.end).toISOString().slice(11, 16)} UTC
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!canTask || tasked}
                    title={canTask ? undefined : "Viewer role cannot task"}
                    onClick={() => taskSatellite(p)}
                    className="flex items-center gap-1 rounded bg-accent-teal/15 px-2 py-1 text-[10px] font-semibold text-accent-teal ring-1 ring-accent-teal/40 hover:bg-accent-teal/25 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Send size={11} />
                    {tasked ? "Tasked (mock)" : "Task"}
                  </button>
                </div>
              );
            })}
            {passes.length === 0 && !loading && (
              <div className="py-6 text-center text-[10px] uppercase tracking-wide text-text-muted">
                No predictions yet
              </div>
            )}
          </div>
        </div>

        <div className="relative flex-1">
          <PreviewMap lat={Number(lat) || 0} lng={Number(lng) || 0} highlightedNoradIds={passes.map((p) => p.noradId)} />
        </div>
      </div>
    </div>
  );
}
