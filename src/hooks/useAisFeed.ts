import { useEffect, useRef, useState } from "react";
import { wsUrl } from "../lib/api";
import { useObjectStore } from "../store/useObjectStore";
import type { GraphEntity } from "../types/ontology";

interface VesselMessage {
  id: string;
  mmsi: number;
  shipName: string;
  lat: number;
  lng: number;
  speedKn?: number;
  headingDeg?: number;
  courseDeg?: number;
  time?: string;
}

type RelayMessage =
  | { type: "status"; status: "disabled" | "connecting" | "live" | "disconnected" }
  | { type: "position"; vessel: VesselMessage };

const STALE_MS = 5 * 60_000;

function mapVessel(v: VesselMessage): GraphEntity {
  return {
    id: v.id,
    type: "Vessel",
    category: "AISStream",
    name: v.shipName,
    lat: v.lat,
    lng: v.lng,
    headingDeg: v.headingDeg ?? v.courseDeg,
    speedKn: v.speedKn,
    status: "active",
    affiliation: `MMSI ${v.mmsi}`,
    classification: "UNCLASSIFIED // OPEN-SOURCE (AISSTREAM.IO)",
    source: "live",
    clearanceLevel: 1,
    description: `Live AIS position report relayed by the Gotham Sim backend. MMSI ${v.mmsi}.`,
    lastUpdate: v.time ?? new Date().toISOString(),
  };
}

export interface AisFeedStatus {
  status: "disabled" | "connecting" | "live" | "disconnected";
  count: number;
  lastUpdatedAt: number | null;
}

/** Subscribes to the backend's /ws/ais relay (never connects to AISStream directly from the browser). */
export function useAisFeed(enabled: boolean): AisFeedStatus {
  const setLiveEntities = useObjectStore((s) => s.setLiveEntities);
  const [wsStatus, setStatus] = useState<AisFeedStatus["status"]>("connecting");
  const [count, setCount] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const vesselsRef = useRef<Map<string, { entity: GraphEntity; seenAt: number }>>(new Map());

  useEffect(() => {
    if (!enabled) {
      setLiveEntities("ships", []);
      vesselsRef.current.clear();
      return;
    }

    const ws = new WebSocket(wsUrl("/ws/ais"));

    function publish() {
      const now = Date.now();
      for (const [id, v] of vesselsRef.current) {
        if (now - v.seenAt > STALE_MS) vesselsRef.current.delete(id);
      }
      const entities = Array.from(vesselsRef.current.values()).map((v) => v.entity);
      setLiveEntities("ships", entities);
      setCount(entities.length);
      setLastUpdatedAt(now);
    }

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data) as RelayMessage;
        if (msg.type === "status") {
          setStatus(msg.status);
        } else if (msg.type === "position" && msg.vessel) {
          const entity = mapVessel(msg.vessel);
          vesselsRef.current.set(entity.id, { entity, seenAt: Date.now() });
          publish();
        }
      } catch {
        // ignore malformed relay message
      }
    };
    ws.onerror = () => setStatus("disconnected");
    ws.onclose = () => setStatus("disconnected");

    const pruneTimer = setInterval(publish, 30_000);

    return () => {
      clearInterval(pruneTimer);
      ws.close();
    };
  }, [enabled, setLiveEntities]);

  return { status: enabled ? wsStatus : "disabled", count, lastUpdatedAt };
}
