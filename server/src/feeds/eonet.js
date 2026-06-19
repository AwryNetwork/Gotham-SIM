import { cached } from "./cache.js";

const EONET_URL = "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=150";

export async function fetchNaturalEvents() {
  return cached("eonet:events", 60_000, async () => {
    const res = await fetch(EONET_URL);
    if (!res.ok) throw new Error(`NASA EONET request failed: ${res.status}`);
    const data = await res.json();
    const events = (data.events || [])
      .map((e) => {
        const geom = e.geometry?.[e.geometry.length - 1];
        if (!geom) return null;
        const coords = geom.type === "Point" ? geom.coordinates : geom.coordinates?.[0];
        if (!coords) return null;
        return {
          id: `eonet:${e.id}`,
          title: e.title,
          category: e.categories?.[0]?.title || "Event",
          lat: coords[1],
          lng: coords[0],
          time: geom.date,
          link: e.link,
        };
      })
      .filter(Boolean);
    return { count: events.length, events };
  });
}
