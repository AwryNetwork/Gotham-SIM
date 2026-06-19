import { useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { useObjectStore, useVisibleEntities } from "../../store/useObjectStore";
import { useLiveRawStore } from "../../store/useLiveRawStore";
import { ENTITY_COLOR } from "../../lib/entityVisuals";
import type { GraphEntity } from "../../types/ontology";

const GLOBE_TEXTURE = "//unpkg.com/three-globe/example/img/earth-dark.jpg";
const BUMP_TEXTURE = "//unpkg.com/three-globe/example/img/earth-topology.png";

export function Globe3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const entities = useVisibleEntities();
  const selectedIds = useObjectStore((s) => s.selectedIds);
  const setSelection = useObjectStore((s) => s.setSelection);

  const geoEntities = useMemo(
    () => entities.filter((e): e is GraphEntity & { lat: number; lng: number } => e.lat !== undefined && e.lng !== undefined),
    [entities],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    globeRef.current?.pointOfView({ lat: 20, lng: 20, altitude: 2.4 }, 0);
    const controls = globeRef.current?.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.3;
    }
  }, []);

  const satellites = useMemo(
    () => geoEntities.filter((e) => e.type === "Satellite"),
    [geoEntities],
  );

  const ringsData = useMemo(
    () =>
      satellites.map((s) => ({
        lat: s.lat,
        lng: s.lng,
      })),
    [satellites],
  );

  // Real Celestrak ground tracks (only available for live satellites).
  const liveSatellites = useLiveRawStore((s) => s.satellites);
  const pathsData = useMemo(
    () => liveSatellites.map((s) => s.groundTrack.map((p) => [p.lat, p.lng])),
    [liveSatellites],
  );

  return (
    <div ref={containerRef} className="h-full w-full">
      <Globe
        ref={globeRef}
        width={size.width}
        height={size.height}
        backgroundColor="#070b12"
        globeImageUrl={GLOBE_TEXTURE}
        bumpImageUrl={BUMP_TEXTURE}
        atmosphereColor="#22d3ee"
        atmosphereAltitude={0.18}
        pointsData={geoEntities as unknown as object[]}
        pointLat={(d) => (d as GraphEntity).lat as number}
        pointLng={(d) => (d as GraphEntity).lng as number}
        pointColor={(d) =>
          selectedIds.includes((d as GraphEntity).id)
            ? "#ffffff"
            : ENTITY_COLOR[(d as GraphEntity).type]
        }
        pointAltitude={0.01}
        pointRadius={(d) => (selectedIds.includes((d as GraphEntity).id) ? 0.55 : 0.35)}
        onPointClick={(d) => setSelection([(d as GraphEntity).id])}
        ringsData={ringsData}
        ringColor={() => (t: number) => `rgba(34, 211, 238, ${1 - t})`}
        ringMaxRadius={4}
        ringPropagationSpeed={2}
        ringRepeatPeriod={1400}
        pathsData={pathsData}
        pathPoints={(d) => d as [number, number][]}
        pathPointLat={(p) => (p as [number, number])[0]}
        pathPointLng={(p) => (p as [number, number])[1]}
        pathColor={() => "rgba(103, 232, 249, 0.55)"}
        pathDashLength={0.4}
        pathDashGap={0.2}
        pathDashAnimateTime={8000}
        pathStroke={0.6}
      />
    </div>
  );
}
