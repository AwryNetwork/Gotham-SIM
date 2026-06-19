import { create } from "zustand";
import type {
  SatelliteState,
  RadarFramesResponse,
  CameraFeedItem,
} from "../hooks/useLiveFeeds";

export interface WeatherAlertRaw {
  id: string;
  event: string;
  severity: string;
  headline: string;
  areaDesc: string;
  effective: string;
  expires: string;
  polygon: number[][][];
}

/**
 * Holds raw live-feed payloads that don't fit GraphEntity (satellite ground
 * tracks, radar tile frames, camera feed URLs, weather alert polygons) so
 * Map2D/Globe3D layers can render them without re-polling per component.
 */
interface LiveRawState {
  satellites: SatelliteState[];
  setSatellites: (v: SatelliteState[]) => void;
  radarFrames: RadarFramesResponse | null;
  setRadarFrames: (v: RadarFramesResponse | null) => void;
  cameras: CameraFeedItem[];
  setCameras: (v: CameraFeedItem[]) => void;
  weatherAlerts: WeatherAlertRaw[];
  setWeatherAlerts: (v: WeatherAlertRaw[]) => void;
}

export const useLiveRawStore = create<LiveRawState>((set) => ({
  satellites: [],
  setSatellites: (v) => set({ satellites: v }),
  radarFrames: null,
  setRadarFrames: (v) => set({ radarFrames: v }),
  cameras: [],
  setCameras: (v) => set({ cameras: v }),
  weatherAlerts: [],
  setWeatherAlerts: (v) => set({ weatherAlerts: v }),
}));
