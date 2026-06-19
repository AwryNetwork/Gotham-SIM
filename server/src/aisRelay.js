import { WebSocketServer, WebSocket } from "ws";

const AISSTREAM_URL = "wss://stream.aisstream.io/v0/stream";

// A default broad bounding box (whole world) — narrow this for less traffic.
const DEFAULT_BBOX = [
  [
    [-90, -180],
    [90, 180],
  ],
];

export function createAisRelay(server) {
  const wss = new WebSocketServer({ server, path: "/ws/ais" });
  const clients = new Set();
  let upstream = null;
  let upstreamStatus = "disabled";

  function broadcast(message) {
    const payload = JSON.stringify(message);
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) client.send(payload);
    }
  }

  function connectUpstream() {
    const apiKey = process.env.AISSTREAM_API_KEY;
    if (!apiKey) {
      upstreamStatus = "disabled";
      return;
    }

    upstreamStatus = "connecting";
    upstream = new WebSocket(AISSTREAM_URL);

    upstream.on("open", () => {
      // AISStream requires the subscription message within 3 seconds of connecting.
      upstream.send(
        JSON.stringify({
          APIKey: apiKey,
          BoundingBoxes: DEFAULT_BBOX,
          FilterMessageTypes: ["PositionReport"],
        }),
      );
      upstreamStatus = "live";
      broadcast({ type: "status", status: "live" });
    });

    upstream.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.MessageType !== "PositionReport") return;
        const report = msg.Message?.PositionReport;
        const meta = msg.MetaData;
        if (!report || !meta) return;
        broadcast({
          type: "position",
          vessel: {
            id: `vessel:${meta.MMSI}`,
            mmsi: meta.MMSI,
            shipName: (meta.ShipName || "").trim() || `MMSI ${meta.MMSI}`,
            lat: report.Latitude,
            lng: report.Longitude,
            speedKn: report.Sog,
            headingDeg: report.TrueHeading ?? report.Cog,
            courseDeg: report.Cog,
            time: meta.time_utc,
          },
        });
      } catch (err) {
        console.warn("[ais] bad message from upstream:", err.message);
      }
    });

    upstream.on("close", () => {
      upstreamStatus = "disconnected";
      broadcast({ type: "status", status: "disconnected" });
      setTimeout(connectUpstream, 5000);
    });

    upstream.on("error", (err) => {
      console.warn("[ais] upstream error:", err.message);
    });
  }

  connectUpstream();

  wss.on("connection", (ws) => {
    clients.add(ws);
    ws.send(JSON.stringify({ type: "status", status: upstreamStatus }));
    ws.on("close", () => clients.delete(ws));
  });

  return wss;
}
