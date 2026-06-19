import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import { cached } from "./cache.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Falls back to the frontend's editable sample file so there's always
// something to render even with no CAMERAS_FEED_URL configured.
const LOCAL_CAMERAS_PATH = path.join(__dirname, "..", "..", "..", "src", "data", "cameras.json");

function kindFromUrl(url) {
  return /\.m3u8(\?|$)/i.test(url) ? "hls" : "image";
}

// To use a real public 511 camera dataset, set CAMERAS_FEED_URL to a GeoJSON
// (or compatible JSON) endpoint. Virginia's VDOT 511 program publishes an
// open camera dataset — see 511virginia.org and openva.com's "VDOT 511
// Geodata" catalog for the current GeoJSON URL and field names. Most other
// state/city 511 programs publish similar public feeds; adjust the
// `normalizeFeature` mapping below to match whichever dataset you point at.
function normalizeFeature(feature) {
  const props = feature.properties || feature;
  const coords = feature.geometry?.coordinates;
  const lng = coords ? coords[0] : props.longitude ?? props.lng;
  const lat = coords ? coords[1] : props.latitude ?? props.lat;
  const url = props.url || props.Url || props.VideoUrl || props.imageUrl || props.ImageUrl;
  const name = props.name || props.Name || props.Location || props.locationName || "Traffic Camera";
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !url) return null;
  return { name, lat, lng, kind: kindFromUrl(url), url };
}

async function loadLocalFallback() {
  const text = await fs.readFile(LOCAL_CAMERAS_PATH, "utf-8");
  const cameras = JSON.parse(text);
  return cameras.map((c) => ({
    name: c.name,
    lat: c.lat,
    lng: c.lng,
    kind: c.kind || kindFromUrl(c.url || c.feedUrl || ""),
    url: c.url || c.feedUrl,
  }));
}

export async function fetchCameras() {
  return cached("cameras:list", 5 * 60_000, async () => {
    const feedUrl = process.env.CAMERAS_FEED_URL;
    if (feedUrl) {
      try {
        const res = await fetch(feedUrl);
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        const features = data.features || data;
        const cameras = features.map(normalizeFeature).filter(Boolean);
        if (cameras.length > 0) {
          return { count: cameras.length, source: "remote", cameras };
        }
      } catch (err) {
        console.warn("[cameras] remote feed failed, falling back to local file:", err.message);
      }
    }
    const cameras = await loadLocalFallback();
    return { count: cameras.length, source: "local", cameras };
  });
}
