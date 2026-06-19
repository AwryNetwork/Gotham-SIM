import { useEffect } from "react";
import { apiFetch } from "../lib/api";
import { usePolling, type PollingResult } from "./usePolling";
import { useObjectStore } from "../store/useObjectStore";
import { useUIStore, type BBox } from "../store/useUIStore";
import type { GraphEntity } from "../types/ontology";

// ---- Backend response shapes (see server/src/feeds/*.js) ----

interface AircraftState {
  id: string;
  icao24: string;
  callsign: string;
  lat: number;
  lng: number;
  altitudeKm?: number;
  headingDeg?: number;
  speedKn?: number;
  onGround?: boolean;
  originCountry?: string;
}
interface AircraftResponse {
  time: number;
  count: number;
  aircraft: AircraftState[];
  authenticated: boolean;
}

export interface SatelliteState {
  id: string;
  noradId: string;
  name: string;
  lat: number;
  lng: number;
  altitudeKm: number;
  groundTrack: { lat: number; lng: number }[];
}
interface SatellitesResponse {
  time: string;
  count: number;
  satellites: SatelliteState[];
}

interface EarthquakeState {
  id: string;
  place: string;
  magnitude: number;
  depthKm: number;
  lat: number;
  lng: number;
  time: string;
  url: string;
}
interface EarthquakesResponse {
  count: number;
  earthquakes: EarthquakeState[];
}

interface EonetEvent {
  id: string;
  title: string;
  category: string;
  lat: number;
  lng: number;
  time: string;
  link: string;
}
interface EonetResponse {
  count: number;
  events: EonetEvent[];
}

export interface WeatherAlert {
  id: string;
  event: string;
  severity: string;
  headline: string;
  areaDesc: string;
  effective: string;
  expires: string;
  polygon: number[][][];
}
interface WeatherAlertsResponse {
  count: number;
  alerts: WeatherAlert[];
}

export interface RadarFrame {
  time: number;
  path: string;
}
export interface RadarFramesResponse {
  host: string;
  past: RadarFrame[];
  nowcast: RadarFrame[];
}

export interface CameraFeedItem {
  name: string;
  lat: number;
  lng: number;
  kind: "image" | "hls";
  url: string;
}
export interface CamerasResponse {
  count: number;
  source: string;
  cameras: CameraFeedItem[];
}

const nowIso = () => new Date().toISOString();

function polygonCentroid(rings: number[][][]): { lat: number; lng: number } | null {
  const ring = rings?.[0];
  if (!ring || ring.length === 0) return null;
  let lat = 0;
  let lng = 0;
  for (const [pLng, pLat] of ring) {
    lat += pLat;
    lng += pLng;
  }
  return { lat: lat / ring.length, lng: lng / ring.length };
}

function mapAircraft(a: AircraftState): GraphEntity {
  return {
    id: a.id,
    type: "Aircraft",
    category: "OpenSky",
    name: a.callsign || a.icao24,
    lat: a.lat,
    lng: a.lng,
    altitudeKm: a.altitudeKm,
    headingDeg: a.headingDeg,
    speedKn: a.speedKn,
    status: a.onGround ? "standby" : "active",
    affiliation: a.originCountry ? `${a.originCountry.toUpperCase()} REGISTERED` : "UNKNOWN OPERATOR",
    classification: "UNCLASSIFIED // OPEN-SOURCE (OPENSKY)",
    source: "live",
    clearanceLevel: 1,
    description: `Live aircraft track via OpenSky Network. ICAO24 ${a.icao24}.`,
    lastUpdate: nowIso(),
  };
}

function mapSatellite(s: SatelliteState): GraphEntity {
  return {
    id: s.id,
    type: "Satellite",
    category: "Celestrak",
    name: s.name,
    lat: s.lat,
    lng: s.lng,
    altitudeKm: s.altitudeKm,
    status: "active",
    affiliation: "PUBLIC ORBITAL CATALOG (CELESTRAK)",
    classification: "UNCLASSIFIED // OPEN-SOURCE (CELESTRAK)",
    source: "live",
    clearanceLevel: 1,
    description: `Live satellite position from public Celestrak TLE data (NORAD ${s.noradId}).`,
    lastUpdate: nowIso(),
    properties: { noradId: s.noradId },
  };
}

function mapEarthquake(e: EarthquakeState): GraphEntity {
  return {
    id: e.id,
    type: "Event",
    category: "USGS Earthquake",
    name: `M${e.magnitude?.toFixed(1) ?? "?"} — ${e.place}`,
    lat: e.lat,
    lng: e.lng,
    status: "active",
    affiliation: "USGS",
    classification: "UNCLASSIFIED // OPEN-SOURCE (USGS)",
    source: "live",
    clearanceLevel: 1,
    description: `Magnitude ${e.magnitude} earthquake, depth ${e.depthKm?.toFixed(1)} km. ${e.place}.`,
    lastUpdate: e.time,
    properties: { magnitude: e.magnitude, depthKm: e.depthKm },
  };
}

function mapEonet(e: EonetEvent): GraphEntity {
  return {
    id: e.id,
    type: "Event",
    category: `EONET ${e.category}`,
    name: e.title,
    lat: e.lat,
    lng: e.lng,
    status: "active",
    affiliation: "NASA EONET",
    classification: "UNCLASSIFIED // OPEN-SOURCE (NASA EONET)",
    source: "live",
    clearanceLevel: 1,
    description: e.title,
    lastUpdate: e.time ?? nowIso(),
  };
}

function mapWeatherAlert(a: WeatherAlert): GraphEntity | null {
  const centroid = polygonCentroid(a.polygon);
  if (!centroid) return null;
  return {
    id: a.id,
    type: "Event",
    category: `NWS ${a.severity}`,
    name: a.event,
    lat: centroid.lat,
    lng: centroid.lng,
    status: "active",
    affiliation: a.areaDesc,
    classification: "UNCLASSIFIED // OPEN-SOURCE (NOAA/NWS)",
    source: "live",
    clearanceLevel: 1,
    description: a.headline,
    lastUpdate: a.effective ?? nowIso(),
  };
}

function bboxQuery(bbox: BBox): string {
  return `?lamin=${bbox.lamin}&lomin=${bbox.lomin}&lamax=${bbox.lamax}&lomax=${bbox.lomax}`;
}

export interface LiveFeedStatus {
  enabled: boolean;
  count: number;
  lastUpdatedAt: number | null;
  error: string | null;
}

export function useAircraftFeed(enabled: boolean): LiveFeedStatus {
  const bbox = useUIStore((s) => s.liveRegionBbox);
  const setLiveEntities = useObjectStore((s) => s.setLiveEntities);
  const { data, error, lastUpdatedAt } = usePolling(
    () => apiFetch<AircraftResponse>(`/api/feeds/aircraft${bboxQuery(bbox)}`),
    12_000,
    enabled,
  );

  useEffect(() => {
    if (!enabled) {
      setLiveEntities("aircraft", []);
      return;
    }
    if (data) setLiveEntities("aircraft", data.aircraft.map(mapAircraft));
  }, [data, enabled, setLiveEntities]);

  return { enabled, count: data?.aircraft.length ?? 0, lastUpdatedAt, error };
}

export function useSatellitesFeed(enabled: boolean): LiveFeedStatus & { raw: SatelliteState[] } {
  const setLiveEntities = useObjectStore((s) => s.setLiveEntities);
  const { data, error, lastUpdatedAt }: PollingResult<SatellitesResponse> = usePolling(
    () => apiFetch<SatellitesResponse>("/api/feeds/satellites"),
    15_000,
    enabled,
  );

  useEffect(() => {
    if (!enabled) {
      setLiveEntities("satellites", []);
      return;
    }
    if (data) setLiveEntities("satellites", data.satellites.map(mapSatellite));
  }, [data, enabled, setLiveEntities]);

  return { enabled, count: data?.satellites.length ?? 0, lastUpdatedAt, error, raw: data?.satellites ?? [] };
}

export function useEarthquakesFeed(enabled: boolean): LiveFeedStatus {
  const setLiveEntities = useObjectStore((s) => s.setLiveEntities);
  const { data, error, lastUpdatedAt } = usePolling(
    () => apiFetch<EarthquakesResponse>("/api/feeds/earthquakes?window=day"),
    30_000,
    enabled,
  );

  useEffect(() => {
    if (!enabled) {
      setLiveEntities("earthquakes", []);
      return;
    }
    if (data) setLiveEntities("earthquakes", data.earthquakes.map(mapEarthquake));
  }, [data, enabled, setLiveEntities]);

  return { enabled, count: data?.earthquakes.length ?? 0, lastUpdatedAt, error };
}

export function useEonetFeed(enabled: boolean): LiveFeedStatus {
  const setLiveEntities = useObjectStore((s) => s.setLiveEntities);
  const { data, error, lastUpdatedAt } = usePolling(
    () => apiFetch<EonetResponse>("/api/feeds/events"),
    60_000,
    enabled,
  );

  useEffect(() => {
    if (!enabled) {
      setLiveEntities("events", []);
      return;
    }
    if (data) setLiveEntities("events", data.events.map(mapEonet));
  }, [data, enabled, setLiveEntities]);

  return { enabled, count: data?.events.length ?? 0, lastUpdatedAt, error };
}

export function useWeatherAlertsFeed(enabled: boolean): LiveFeedStatus & { raw: WeatherAlert[] } {
  const setLiveEntities = useObjectStore((s) => s.setLiveEntities);
  const { data, error, lastUpdatedAt } = usePolling(
    () => apiFetch<WeatherAlertsResponse>("/api/feeds/weather-alerts"),
    30_000,
    enabled,
  );

  useEffect(() => {
    if (!enabled) {
      setLiveEntities("weatherAlerts", []);
      return;
    }
    if (data) {
      const mapped = data.alerts.map(mapWeatherAlert).filter((e): e is GraphEntity => e !== null);
      setLiveEntities("weatherAlerts", mapped);
    }
  }, [data, enabled, setLiveEntities]);

  return { enabled, count: data?.alerts.length ?? 0, lastUpdatedAt, error, raw: data?.alerts ?? [] };
}

export function useRadarFramesFeed(enabled: boolean): LiveFeedStatus & { frames: RadarFramesResponse | null } {
  const { data, error, lastUpdatedAt } = usePolling(
    () => apiFetch<RadarFramesResponse>("/api/feeds/radar-frames"),
    5 * 60_000,
    enabled,
  );
  const count = (data?.past.length ?? 0) + (data?.nowcast.length ?? 0);
  return { enabled, count, lastUpdatedAt, error, frames: data };
}

export function useCamerasFeed(enabled: boolean): LiveFeedStatus & { cameras: CameraFeedItem[] } {
  const { data, error, lastUpdatedAt } = usePolling(
    () => apiFetch<CamerasResponse>("/api/feeds/cameras"),
    5 * 60_000,
    enabled,
  );
  return { enabled, count: data?.cameras.length ?? 0, lastUpdatedAt, error, cameras: data?.cameras ?? [] };
}
