import { cached } from "./cache.js";

const ALERTS_URL = "https://api.weather.gov/alerts/active";

export async function fetchWeatherAlerts() {
  const userAgent = process.env.NWS_USER_AGENT || "GothamSim (no-contact-set)";
  return cached("nws:alerts", 30_000, async () => {
    const res = await fetch(ALERTS_URL, {
      headers: { "User-Agent": userAgent, Accept: "application/geo+json" },
    });
    if (!res.ok) throw new Error(`NWS request failed: ${res.status}`);
    const data = await res.json();
    const alerts = (data.features || [])
      .filter((f) => f.geometry && f.geometry.type === "Polygon")
      .slice(0, 200)
      .map((f) => ({
        id: `alert:${f.id}`,
        event: f.properties.event,
        severity: f.properties.severity,
        headline: f.properties.headline,
        areaDesc: f.properties.areaDesc,
        effective: f.properties.effective,
        expires: f.properties.expires,
        polygon: f.geometry.coordinates,
      }));
    return { count: alerts.length, alerts };
  });
}
