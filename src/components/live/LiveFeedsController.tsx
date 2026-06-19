import { useEffect } from "react";
import { useUIStore } from "../../store/useUIStore";
import { useLiveRawStore } from "../../store/useLiveRawStore";
import {
  useAircraftFeed,
  useSatellitesFeed,
  useEarthquakesFeed,
  useEonetFeed,
  useWeatherAlertsFeed,
  useRadarFramesFeed,
  useCamerasFeed,
  type LiveFeedStatus,
} from "../../hooks/useLiveFeeds";
import { useGdeltFeed } from "../../hooks/useGdeltFeed";
import { useAisFeed } from "../../hooks/useAisFeed";

/**
 * Mounted once in AppShell so live feeds keep polling and merging into the
 * shared object model regardless of which view is active — Map, Network
 * Graph, Data, and Search all read the same store. Renders nothing.
 */
export function LiveFeedsController() {
  const liveLayers = useUIStore((s) => s.liveLayers);
  const setLiveFeedStatus = useUIStore((s) => s.setLiveFeedStatus);

  const aircraft = useAircraftFeed(liveLayers.aircraft);
  const satellites = useSatellitesFeed(liveLayers.satellites);
  const earthquakes = useEarthquakesFeed(liveLayers.earthquakes);
  const events = useEonetFeed(liveLayers.events);
  const weatherAlerts = useWeatherAlertsFeed(liveLayers.weatherAlerts);
  const radar = useRadarFramesFeed(liveLayers.radar);
  const cameras = useCamerasFeed(liveLayers.cameras);
  const osint = useGdeltFeed(liveLayers.osint);
  const ships = useAisFeed(liveLayers.ships);

  useStatusSync("aircraft", aircraft, setLiveFeedStatus);
  useStatusSync("satellites", satellites, setLiveFeedStatus);
  useStatusSync("earthquakes", earthquakes, setLiveFeedStatus);
  useStatusSync("events", events, setLiveFeedStatus);
  useStatusSync("weatherAlerts", weatherAlerts, setLiveFeedStatus);
  useStatusSync("radar", radar, setLiveFeedStatus);
  useStatusSync("cameras", cameras, setLiveFeedStatus);
  useStatusSync("osint", osint, setLiveFeedStatus);

  useEffect(() => {
    setLiveFeedStatus("ships", {
      count: ships.count,
      lastUpdatedAt: ships.lastUpdatedAt,
      error: ships.status === "disconnected" ? "AIS relay disconnected" : null,
    });
  }, [ships.count, ships.lastUpdatedAt, ships.status, setLiveFeedStatus]);

  const setSatellites = useLiveRawStore((s) => s.setSatellites);
  const setRadarFrames = useLiveRawStore((s) => s.setRadarFrames);
  const setCameras = useLiveRawStore((s) => s.setCameras);
  const setWeatherAlerts = useLiveRawStore((s) => s.setWeatherAlerts);

  useEffect(() => {
    setSatellites(liveLayers.satellites ? satellites.raw : []);
  }, [satellites.raw, liveLayers.satellites, setSatellites]);

  useEffect(() => {
    setRadarFrames(liveLayers.radar ? radar.frames : null);
  }, [radar.frames, liveLayers.radar, setRadarFrames]);

  useEffect(() => {
    setCameras(liveLayers.cameras ? cameras.cameras : []);
  }, [cameras.cameras, liveLayers.cameras, setCameras]);

  useEffect(() => {
    setWeatherAlerts(liveLayers.weatherAlerts ? weatherAlerts.raw : []);
  }, [weatherAlerts.raw, liveLayers.weatherAlerts, setWeatherAlerts]);

  return null;
}

function useStatusSync(
  layer: string,
  status: LiveFeedStatus,
  setLiveFeedStatus: (layer: string, status: { count: number; lastUpdatedAt: number | null; error: string | null }) => void,
) {
  useEffect(() => {
    setLiveFeedStatus(layer, {
      count: status.count,
      lastUpdatedAt: status.lastUpdatedAt,
      error: status.error,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer, status.count, status.lastUpdatedAt, status.error]);
}
