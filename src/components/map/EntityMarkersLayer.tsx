import { useEffect, useRef } from "react";
import maplibregl, { type Marker } from "maplibre-gl";
import { useObjectStore, useVisibleEntities } from "../../store/useObjectStore";
import { ENTITY_COLOR } from "../../lib/entityVisuals";
import { useMap } from "./MapContext";
import type { GraphEntity } from "../../types/ontology";

function earthquakeSizePx(entity: GraphEntity): number {
  const mag = Number(entity.properties?.magnitude ?? 3);
  return Math.max(8, Math.min(30, 6 + mag * 3));
}

function buildMarkerElement(entity: GraphEntity): HTMLDivElement {
  const el = document.createElement("div");
  el.dataset.entityId = entity.id;
  el.style.cursor = "pointer";

  if (entity.type === "Aircraft") {
    // A rotated triangle pointing in the direction of travel.
    el.style.width = "0";
    el.style.height = "0";
    el.style.borderLeft = "5px solid transparent";
    el.style.borderRight = "5px solid transparent";
    el.style.borderBottom = `10px solid ${ENTITY_COLOR.Aircraft}`;
    el.style.transformOrigin = "50% 70%";
  } else if (entity.category === "USGS Earthquake") {
    const size = earthquakeSizePx(entity);
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.borderRadius = "50%";
    el.style.border = "1.5px solid #070b12";
  } else {
    el.style.width = "10px";
    el.style.height = "10px";
    el.style.borderRadius = "50%";
    el.style.border = "1.5px solid #070b12";
  }
  return el;
}

function applyMarkerStyle(el: HTMLDivElement, entity: GraphEntity, selected: boolean) {
  const color = selected ? "#ffffff" : ENTITY_COLOR[entity.type];

  if (entity.type === "Aircraft") {
    el.style.borderBottomColor = color;
    el.style.filter = selected ? "drop-shadow(0 0 4px rgba(255,255,255,0.9))" : `drop-shadow(0 0 3px ${color})`;
    el.style.transform = `rotate(${entity.headingDeg ?? 0}deg)`;
    el.style.zIndex = selected ? "5" : "1";
    return;
  }

  el.style.backgroundColor = color;
  el.style.boxShadow = selected
    ? "0 0 0 3px rgba(255,255,255,0.5), 0 0 10px rgba(255,255,255,0.8)"
    : `0 0 6px ${color}`;
  if (entity.category !== "USGS Earthquake") {
    el.style.width = selected ? "13px" : "10px";
    el.style.height = selected ? "13px" : "10px";
  }
  el.style.zIndex = selected ? "5" : "1";
}

export function EntityMarkersLayer() {
  const map = useMap();
  const markersRef = useRef<Map<string, Marker>>(new globalThis.Map());
  const entities = useVisibleEntities();
  const selectedIds = useObjectStore((s) => s.selectedIds);
  const setSelection = useObjectStore((s) => s.setSelection);

  const geoEntities = entities.filter((e) => e.lat !== undefined && e.lng !== undefined);

  useEffect(() => {
    if (!map) return;

    const seen = new Set<string>();
    for (const entity of geoEntities) {
      seen.add(entity.id);
      let marker = markersRef.current.get(entity.id);
      if (!marker) {
        const el = buildMarkerElement(entity);
        marker = new maplibregl.Marker({ element: el }).setLngLat([entity.lng as number, entity.lat as number]);
        el.addEventListener("click", (evt) => {
          evt.stopPropagation();
          setSelection([entity.id]);
        });
        marker.addTo(map);
        markersRef.current.set(entity.id, marker);
      } else {
        marker.setLngLat([entity.lng as number, entity.lat as number]);
      }
      applyMarkerStyle(marker.getElement() as HTMLDivElement, entity, selectedIds.includes(entity.id));
    }

    for (const [id, marker] of markersRef.current) {
      if (!seen.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, geoEntities, selectedIds]);

  useEffect(() => {
    const markers = markersRef.current;
    return () => {
      markers.forEach((m) => m.remove());
      markers.clear();
    };
  }, []);

  return null;
}
