import { cached } from "./cache.js";

// GDELT GEO 2.0 API is keyless. Returns a GeoJSON FeatureCollection of
// geolocated news-event clusters from the last `timespan`. Optional and
// clearly labeled as unverified OSINT in the UI — this is raw open news
// clustering, not vetted intelligence.
const GDELT_URL =
  "https://api.gdeltproject.org/api/v2/geo/geo?query=&format=GeoJSON&timespan=24h";

export async function fetchOsintEvents() {
  return cached("gdelt:events", 5 * 60_000, async () => {
    const res = await fetch(GDELT_URL);
    if (!res.ok) throw new Error(`GDELT request failed: ${res.status}`);
    const data = await res.json();
    const events = (data.features || [])
      .filter((f) => f.geometry?.type === "Point" && Array.isArray(f.geometry.coordinates))
      .slice(0, 150)
      .map((f, i) => ({
        id: `gdelt:${i}:${f.properties?.name || "event"}`,
        name: f.properties?.name || "Unnamed news cluster",
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        count: f.properties?.count ?? 1,
        url: f.properties?.shareimage || "",
      }));
    return { count: events.length, events };
  });
}
