import * as satellite from "satellite.js";
import { cached } from "./cache.js";

// Celestrak GP data is keyless and free to use. "stations" includes the ISS
// and other crewed/space-station objects; swap GROUP= for other curated
// Celestrak groups (e.g. "weather", "gps-ops") to track more satellites.
const TLE_URL = "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=TLE";

function parseTleText(text) {
  const lines = text.split("\n").map((l) => l.trimEnd()).filter(Boolean);
  const records = [];
  for (let i = 0; i + 2 < lines.length + 1; i += 3) {
    const name = lines[i];
    const line1 = lines[i + 1];
    const line2 = lines[i + 2];
    if (!name || !line1 || !line2) continue;
    records.push({ name: name.trim(), line1, line2 });
  }
  return records;
}

async function fetchTleRecords() {
  return cached("satellites:tle-raw", 6 * 60 * 60_000, async () => {
    const res = await fetch(TLE_URL);
    if (!res.ok) throw new Error(`Celestrak TLE request failed: ${res.status}`);
    const text = await res.text();
    return parseTleText(text);
  });
}

function noradIdFromLine1(line1) {
  return line1.slice(2, 7).trim();
}

function computeGroundTrack(satrec, fromDate, periodMinutes, steps = 60) {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = new Date(fromDate.getTime() + (periodMinutes * 60_000 * i) / steps);
    const pv = satellite.propagate(satrec, t);
    if (!pv.position) continue;
    const gmst = satellite.gstime(t);
    const geo = satellite.eciToGeodetic(pv.position, gmst);
    points.push({
      lat: satellite.degreesLat(geo.latitude),
      lng: satellite.degreesLong(geo.longitude),
    });
  }
  return points;
}

export async function getSatrecs() {
  const records = await fetchTleRecords();
  return records.map((r) => ({
    name: r.name,
    noradId: noradIdFromLine1(r.line1),
    satrec: satellite.twoline2satrec(r.line1, r.line2),
  }));
}

export async function fetchSatellites() {
  return cached("satellites:positions", 10_000, async () => {
    const recs = await getSatrecs();
    const now = new Date();
    const gmst = satellite.gstime(now);

    const satellites = recs
      .map(({ name, noradId, satrec }) => {
        const pv = satellite.propagate(satrec, now);
        if (!pv.position) return null;
        const geo = satellite.eciToGeodetic(pv.position, gmst);
        const lat = satellite.degreesLat(geo.latitude);
        const lng = satellite.degreesLong(geo.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        // satrec.no is mean motion in radians/minute; derive orbital period from it.
        const periodMin = (2 * Math.PI) / satrec.no;

        return {
          id: `sat:${noradId}`,
          noradId,
          name,
          lat,
          lng,
          altitudeKm: geo.height,
          groundTrack: computeGroundTrack(satrec, now, periodMin),
        };
      })
      .filter(Boolean);

    return { time: now.toISOString(), count: satellites.length, satellites };
  });
}

/**
 * Approximate pass prediction: steps through [start, end] and flags windows
 * where a satellite's ground track passes within `thresholdKm` of the
 * target lat/lng. This is a simplified footprint check (great-circle
 * distance to the sub-satellite point), not a true elevation-angle horizon
 * calculation — good enough for visualization/tasking-demo purposes.
 */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function predictPasses({ lat, lng, start, end, thresholdKm = 1500, stepMinutes = 1 }) {
  const recs = await getSatrecs();
  const startDate = new Date(start);
  const endDate = new Date(end);
  const passes = [];

  for (const { name, noradId, satrec } of recs) {
    let inPass = false;
    let passStart = null;
    let closestKm = Infinity;

    for (let t = startDate.getTime(); t <= endDate.getTime(); t += stepMinutes * 60_000) {
      const time = new Date(t);
      const pv = satellite.propagate(satrec, time);
      if (!pv.position) continue;
      const gmst = satellite.gstime(time);
      const geo = satellite.eciToGeodetic(pv.position, gmst);
      const slat = satellite.degreesLat(geo.latitude);
      const slng = satellite.degreesLong(geo.longitude);
      const distKm = haversineKm(lat, lng, slat, slng);
      closestKm = Math.min(closestKm, distKm);

      const within = distKm <= thresholdKm;
      if (within && !inPass) {
        inPass = true;
        passStart = time.toISOString();
      } else if (!within && inPass) {
        inPass = false;
        passes.push({ noradId, name, start: passStart, end: time.toISOString() });
        passStart = null;
      }
    }
    if (inPass && passStart) {
      passes.push({ noradId, name, start: passStart, end: endDate.toISOString() });
    }
  }

  return passes.sort((a, b) => new Date(a.start) - new Date(b.start));
}
