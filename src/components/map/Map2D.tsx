import { useEffect, useRef, useState } from "react";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapContext } from "./MapContext";
import { EntityMarkersLayer } from "./EntityMarkersLayer";
import { CameraLayer } from "./CameraLayer";
import { DrawToolbar } from "./DrawToolbar";
import { SatelliteGroundTrackLayer } from "./SatelliteGroundTrackLayer";
import { WeatherAlertsLayer } from "./WeatherAlertsLayer";
import { RadarTileLayer } from "./RadarTileLayer";
import { useUIStore } from "../../store/useUIStore";

const STYLE_URL = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export function Map2D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const setLiveRegionBbox = useUIStore((s) => s.setLiveRegionBbox);

  useEffect(() => {
    if (!containerRef.current) return;

    const instance = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [20, 20],
      zoom: 1.6,
      attributionControl: { compact: true },
    });
    instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    instance.on("load", () => setMap(instance));
    instance.on("moveend", () => {
      const b = instance.getBounds();
      setLiveRegionBbox({
        lamin: b.getSouth(),
        lomin: b.getWest(),
        lamax: b.getNorth(),
        lomax: b.getEast(),
      });
    });
    mapInstanceRef.current = instance;

    return () => {
      instance.remove();
      mapInstanceRef.current = null;
      setMap(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <MapContext.Provider value={map}>
        {map && (
          <>
            <RadarTileLayer />
            <SatelliteGroundTrackLayer />
            <WeatherAlertsLayer />
            <EntityMarkersLayer />
            <CameraLayer />
            <DrawToolbar />
          </>
        )}
      </MapContext.Provider>
    </div>
  );
}
