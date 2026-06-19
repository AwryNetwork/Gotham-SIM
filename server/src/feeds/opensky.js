import { cached } from "./cache.js";

const TOKEN_URL =
  "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
const STATES_URL = "https://opensky-network.org/api/states/all";

let tokenCache = { token: null, expiresAt: 0 };

async function getToken() {
  const clientId = process.env.OPENSKY_CLIENT_ID;
  const clientSecret = process.env.OPENSKY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenSky token request failed: ${res.status}`);
  }
  const data = await res.json();
  tokenCache = {
    token: data.access_token,
    // refresh a little early
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return tokenCache.token;
}

const STATE_FIELDS = [
  "icao24",
  "callsign",
  "origin_country",
  "time_position",
  "last_contact",
  "longitude",
  "latitude",
  "baro_altitude",
  "on_ground",
  "velocity",
  "true_track",
  "vertical_rate",
  "sensors",
  "geo_altitude",
  "squawk",
  "spi",
  "position_source",
  "category",
];

function mapState(arr) {
  const s = Object.fromEntries(STATE_FIELDS.map((field, i) => [field, arr[i]]));
  return {
    id: `aircraft:${s.icao24}`,
    icao24: s.icao24,
    callsign: (s.callsign || "").trim() || s.icao24,
    lat: s.latitude,
    lng: s.longitude,
    altitudeKm: s.geo_altitude != null ? s.geo_altitude / 1000 : undefined,
    headingDeg: s.true_track ?? undefined,
    speedKn: s.velocity != null ? Math.round(s.velocity * 1.94384) : undefined,
    onGround: s.on_ground,
    originCountry: s.origin_country,
  };
}

export async function fetchAircraft(bbox) {
  return cached(`aircraft:${JSON.stringify(bbox)}`, 12_000, async () => {
    const token = await getToken().catch((err) => {
      console.warn("[opensky] token error, falling back to anonymous:", err.message);
      return null;
    });

    const params = new URLSearchParams();
    if (bbox) {
      params.set("lamin", bbox.lamin);
      params.set("lomin", bbox.lomin);
      params.set("lamax", bbox.lamax);
      params.set("lomax", bbox.lomax);
    }
    const url = params.size ? `${STATES_URL}?${params}` : STATES_URL;

    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      throw new Error(`OpenSky states request failed: ${res.status}`);
    }
    const data = await res.json();
    const states = (data.states || [])
      .map(mapState)
      .filter((a) => Number.isFinite(a.lat) && Number.isFinite(a.lng));
    return { time: data.time, count: states.length, aircraft: states, authenticated: !!token };
  });
}
