import { cached } from "./cache.js";

const FEEDS = {
  hour: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson",
  day: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson",
};

export async function fetchEarthquakes(window = "day") {
  const url = FEEDS[window] || FEEDS.day;
  return cached(`earthquakes:${window}`, 30_000, async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`USGS request failed: ${res.status}`);
    const data = await res.json();
    const earthquakes = (data.features || []).map((f) => ({
      id: `eq:${f.id}`,
      place: f.properties.place,
      magnitude: f.properties.mag,
      depthKm: f.geometry.coordinates[2],
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
      time: new Date(f.properties.time).toISOString(),
      url: f.properties.url,
    }));
    return { count: earthquakes.length, earthquakes };
  });
}
