import { useEffect, useRef, useState } from "react";
import {
  TerraDraw,
  TerraDrawPointMode,
  TerraDrawLineStringMode,
  TerraDrawPolygonMode,
  TerraDrawCircleMode,
  TerraDrawSelectMode,
} from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import { length as turfLength, area as turfArea, distance as turfDistance } from "@turf/turf";
import {
  MousePointer2,
  MapPin,
  Spline,
  Pentagon,
  Circle as CircleIcon,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useMap } from "./MapContext";

type Mode = "select" | "point" | "linestring" | "polygon" | "circle";

const MODE_BUTTONS: { mode: Mode; label: string; icon: typeof MousePointer2 }[] = [
  { mode: "select", label: "Select / Pan", icon: MousePointer2 },
  { mode: "point", label: "Drop point", icon: MapPin },
  { mode: "linestring", label: "Draw line / measure distance", icon: Spline },
  { mode: "polygon", label: "Draw polygon / measure area", icon: Pentagon },
  { mode: "circle", label: "Range ring / buffer", icon: CircleIcon },
];

export function DrawToolbar() {
  const map = useMap();
  const drawRef = useRef<TerraDraw | null>(null);
  const geofenceModeRef = useRef(false);
  const [mode, setMode] = useState<Mode>("select");
  const [geofenceMode, setGeofenceMode] = useState(false);
  const [measurement, setMeasurement] = useState<string | null>(null);

  useEffect(() => {
    geofenceModeRef.current = geofenceMode;
  }, [geofenceMode]);

  useEffect(() => {
    if (!map) return;

    const draw = new TerraDraw({
      adapter: new TerraDrawMapLibreGLAdapter({ map }),
      modes: [
        new TerraDrawSelectMode({
          flags: {
            point: { feature: { draggable: true } },
            linestring: {
              feature: { draggable: true, coordinates: { draggable: true, deletable: true } },
            },
            polygon: {
              feature: { draggable: true, coordinates: { draggable: true, deletable: true } },
            },
            circle: { feature: { draggable: true } },
          },
        }),
        new TerraDrawPointMode(),
        new TerraDrawLineStringMode(),
        new TerraDrawPolygonMode(),
        new TerraDrawCircleMode(),
      ],
    });
    draw.start();
    draw.setMode("select");
    drawRef.current = draw;

    const measureFeature = (id: string | number) => {
      const feature = draw.getSnapshotFeature(id);
      if (!feature) return;
      const featureMode = (feature.properties as { mode?: string } | undefined)?.mode;

      if (feature.geometry.type === "LineString") {
        const km = turfLength(feature as never, { units: "kilometers" });
        setMeasurement(`Distance: ${km.toFixed(2)} km`);
      } else if (feature.geometry.type === "Polygon" && featureMode === "circle") {
        const coords = feature.geometry.coordinates[0];
        const center = coords[0];
        const edge = coords[Math.floor(coords.length / 4)];
        const radiusKm = turfDistance(center, edge, { units: "kilometers" });
        setMeasurement(`Range ring radius: ${radiusKm.toFixed(2)} km`);
      } else if (feature.geometry.type === "Polygon") {
        const sqm = turfArea(feature as never);
        setMeasurement(`Area: ${(sqm / 1_000_000).toFixed(2)} km²`);
      }
    };

    draw.on("finish", (id) => {
      if (geofenceModeRef.current) {
        const feature = draw.getSnapshotFeature(id);
        if (feature?.geometry.type === "Polygon") {
          draw.updateFeatureProperties(id, { kind: "geofence" });
        }
      }
      measureFeature(id);
    });

    draw.on("change", (ids) => {
      if (ids.length > 0) measureFeature(ids[0]);
    });

    return () => {
      draw.stop();
      drawRef.current = null;
    };
  }, [map]);

  const selectMode = (m: Mode) => {
    setMode(m);
    setMeasurement(null);
    drawRef.current?.setMode(m);
  };

  const clearAll = () => {
    drawRef.current?.clear();
    setMeasurement(null);
  };

  return (
    <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded border border-border bg-bg-panel/95 p-1 backdrop-blur">
      {MODE_BUTTONS.map((btn) => {
        const Icon = btn.icon;
        return (
          <button
            key={btn.mode}
            type="button"
            title={btn.label}
            onClick={() => selectMode(btn.mode)}
            className={[
              "flex h-8 w-8 items-center justify-center rounded transition-colors",
              mode === btn.mode
                ? "bg-accent-cyan/15 text-accent-cyan ring-1 ring-accent-cyan/40"
                : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary",
            ].join(" ")}
          >
            <Icon size={15} />
          </button>
        );
      })}

      <div className="mx-1 h-5 w-px bg-border" />

      <button
        type="button"
        title="New polygons are tagged as geofences"
        onClick={() => setGeofenceMode((g) => !g)}
        className={[
          "flex h-8 w-8 items-center justify-center rounded transition-colors",
          geofenceMode
            ? "bg-danger/15 text-danger ring-1 ring-danger/40"
            : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary",
        ].join(" ")}
      >
        <ShieldAlert size={15} />
      </button>

      <button
        type="button"
        title="Clear all drawings"
        onClick={clearAll}
        className="flex h-8 w-8 items-center justify-center rounded text-text-secondary transition-colors hover:bg-danger/15 hover:text-danger"
      >
        <Trash2 size={15} />
      </button>

      {measurement && (
        <>
          <div className="mx-1 h-5 w-px bg-border" />
          <span className="font-mono-data px-2 text-[11px] text-accent-cyan">
            {measurement}
          </span>
        </>
      )}
    </div>
  );
}
