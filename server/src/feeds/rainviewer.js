import { cached } from "./cache.js";

const FRAMES_URL = "https://api.rainviewer.com/public/weather-maps.json";

export async function fetchRadarFrames() {
  return cached("rainviewer:frames", 5 * 60_000, async () => {
    const res = await fetch(FRAMES_URL);
    if (!res.ok) throw new Error(`RainViewer request failed: ${res.status}`);
    const data = await res.json();
    return {
      host: data.host,
      past: data.radar?.past || [],
      nowcast: data.radar?.nowcast || [],
    };
  });
}
