import { useEffect } from "react";
import { apiFetch } from "../lib/api";
import { usePolling } from "./usePolling";
import { useObjectStore } from "../store/useObjectStore";
import type { GraphEntity } from "../types/ontology";
import type { LiveFeedStatus } from "./useLiveFeeds";

interface OsintEvent {
  id: string;
  name: string;
  lat: number;
  lng: number;
  count: number;
  url: string;
}
interface OsintEventsResponse {
  count: number;
  events: OsintEvent[];
}

function mapOsintEvent(e: OsintEvent): GraphEntity {
  return {
    id: e.id,
    type: "Event",
    category: "GDELT OSINT",
    name: e.name,
    lat: e.lat,
    lng: e.lng,
    status: "unknown",
    affiliation: "GDELT GEO 2.0 (unverified open news)",
    classification: "UNCLASSIFIED // OPEN-SOURCE (GDELT, UNVERIFIED)",
    source: "live",
    clearanceLevel: 1,
    description: `Open-source news event cluster (${e.count} article${e.count === 1 ? "" : "s"}). Unverified OSINT — not vetted intelligence.`,
    lastUpdate: new Date().toISOString(),
  };
}

/** Optional, clearly-labeled layer: unverified open-news event clustering from GDELT GEO 2.0. */
export function useGdeltFeed(enabled: boolean): LiveFeedStatus {
  const setLiveEntities = useObjectStore((s) => s.setLiveEntities);
  const { data, error, lastUpdatedAt } = usePolling(
    () => apiFetch<OsintEventsResponse>("/api/feeds/osint-events"),
    5 * 60_000,
    enabled,
  );

  useEffect(() => {
    if (!enabled) {
      setLiveEntities("osint", []);
      return;
    }
    if (data) setLiveEntities("osint", data.events.map(mapOsintEvent));
  }, [data, enabled, setLiveEntities]);

  return { enabled, count: data?.events.length ?? 0, lastUpdatedAt, error };
}
