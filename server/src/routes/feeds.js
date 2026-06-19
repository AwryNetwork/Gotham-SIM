import { Router } from "express";
import { fetchAircraft } from "../feeds/opensky.js";
import { fetchSatellites, predictPasses } from "../feeds/satellites.js";
import { fetchEarthquakes } from "../feeds/earthquakes.js";
import { fetchNaturalEvents } from "../feeds/eonet.js";
import { fetchWeatherAlerts } from "../feeds/nws.js";
import { fetchCameras } from "../feeds/cameras.js";
import { fetchRadarFrames } from "../feeds/rainviewer.js";
import { fetchOsintEvents } from "../feeds/gdelt.js";

export const feedsRouter = Router();

function handle(fn) {
  return async (req, res) => {
    try {
      const data = await fn(req);
      res.json(data);
    } catch (err) {
      console.error(`[feeds] ${req.path} error:`, err.message);
      res.status(502).json({ error: err.message });
    }
  };
}

feedsRouter.get(
  "/aircraft",
  handle((req) => {
    const { lamin, lomin, lamax, lomax } = req.query;
    const bbox = lamin ? { lamin, lomin, lamax, lomax } : null;
    return fetchAircraft(bbox);
  }),
);

feedsRouter.get(
  "/satellites",
  handle(() => fetchSatellites()),
);

feedsRouter.get(
  "/satellite-passes",
  handle((req) => {
    const { lat, lng, start, end, thresholdKm } = req.query;
    if (!lat || !lng || !start || !end) {
      throw new Error("lat, lng, start, and end are required");
    }
    return predictPasses({
      lat: Number(lat),
      lng: Number(lng),
      start,
      end,
      thresholdKm: thresholdKm ? Number(thresholdKm) : undefined,
    }).then((passes) => ({ count: passes.length, passes }));
  }),
);

feedsRouter.get(
  "/earthquakes",
  handle((req) => fetchEarthquakes(req.query.window)),
);

feedsRouter.get(
  "/events",
  handle(() => fetchNaturalEvents()),
);

feedsRouter.get(
  "/weather-alerts",
  handle(() => fetchWeatherAlerts()),
);

feedsRouter.get(
  "/cameras",
  handle(() => fetchCameras()),
);

feedsRouter.get(
  "/radar-frames",
  handle(() => fetchRadarFrames()),
);

feedsRouter.get(
  "/osint-events",
  handle(() => fetchOsintEvents()),
);
