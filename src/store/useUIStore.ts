import { create } from "zustand";

export type MapMode = "3d" | "2d";

export interface BBox {
  lamin: number;
  lomin: number;
  lamax: number;
  lomax: number;
}

export interface LiveLayerToggles {
  aircraft: boolean;
  ships: boolean;
  satellites: boolean;
  earthquakes: boolean;
  events: boolean;
  weatherAlerts: boolean;
  radar: boolean;
  cameras: boolean;
  osint: boolean;
}

// Default region before the user pans the 2D map — CONUS.
const DEFAULT_BBOX: BBox = { lamin: 24, lomin: -125, lamax: 50, lomax: -66 };

export interface LiveFeedStatusEntry {
  count: number;
  lastUpdatedAt: number | null;
  error: string | null;
}

interface UIState {
  mapMode: MapMode;
  setMapMode: (mode: MapMode) => void;
  toggleMapMode: () => void;
  timelineOpen: boolean;
  toggleTimeline: () => void;
  camerasVisible: boolean;
  toggleCameras: () => void;
  liveFeedsPanelOpen: boolean;
  toggleLiveFeedsPanel: () => void;
  liveLayers: LiveLayerToggles;
  toggleLiveLayer: (layer: keyof LiveLayerToggles) => void;
  liveRegionBbox: BBox;
  setLiveRegionBbox: (bbox: BBox) => void;
  liveFeedStatus: Record<string, LiveFeedStatusEntry>;
  setLiveFeedStatus: (layer: string, status: LiveFeedStatusEntry) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  mapMode: "3d",
  setMapMode: (mode) => set({ mapMode: mode }),
  toggleMapMode: () => set({ mapMode: get().mapMode === "3d" ? "2d" : "3d" }),
  timelineOpen: true,
  toggleTimeline: () => set({ timelineOpen: !get().timelineOpen }),
  camerasVisible: false,
  toggleCameras: () => set({ camerasVisible: !get().camerasVisible }),
  liveFeedsPanelOpen: false,
  toggleLiveFeedsPanel: () => set({ liveFeedsPanelOpen: !get().liveFeedsPanelOpen }),
  liveLayers: {
    aircraft: true,
    ships: true,
    satellites: true,
    earthquakes: true,
    events: true,
    weatherAlerts: true,
    radar: false,
    cameras: true,
    osint: false,
  },
  toggleLiveLayer: (layer) =>
    set((s) => ({ liveLayers: { ...s.liveLayers, [layer]: !s.liveLayers[layer] } })),
  liveRegionBbox: DEFAULT_BBOX,
  setLiveRegionBbox: (bbox) => set({ liveRegionBbox: bbox }),
  liveFeedStatus: {},
  setLiveFeedStatus: (layer, status) =>
    set((s) => ({ liveFeedStatus: { ...s.liveFeedStatus, [layer]: status } })),
}));
