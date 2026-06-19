
# Gotham Sim

A tactical command/intelligence dashboard styled after Palantir Gotham, with
**two clearly separated data layers**:

- **Live, real, open-source data** — Map, Network Graph, Data, Search,
  Timeline, and Sensor Tasking are powered by public feeds (OpenSky,
  AISStream.io, Celestrak, USGS, NASA EONET, NOAA/NWS, RainViewer, VDOT 511,
  optionally GDELT). This is real-world data, not simulated.
- **The Kill Chain / Task Planner is a self-contained simulator.** It runs
  on its own fictional asset/target dataset (`src/data/simulatorAssets.ts`),
  tagged `source: "simulator"`, and never reads live-tracked entities. No
  real targeting logic, weaponeering, or real-world effects — "match score"
  is a simple function over fictional distance/availability/payload count.

A bundled "Sample dataset" (fictional satellites/ships/aircraft/ground
sites + a synthetic multi-source "system integration" scenario, tagged
`source: "sample"`) is also available — useful offline or when API quota
runs out — and can be toggled independently of live data.

Every entity in the shared object model carries a `source: "live" |
"sample" | "simulator"` tag and a `clearanceLevel` used for RBAC.

## Stack

**Frontend** — React 18 + TypeScript + Vite, Tailwind CSS v4, Zustand
(persisted shared object model + auth), React Router, lucide-react,
[react-globe.gl](https://github.com/vasturiano/react-globe.gl) (3D globe),
[MapLibre GL JS](https://maplibre.org/) (2D map, CARTO Dark Matter basemap),
[Cytoscape.js](https://js.cytoscape.org/) + `cytoscape-fcose` (network
graph), [Terra Draw](https://terradraw.io/) + [Turf.js](https://turfjs.org/)
(map drawing/measuring), [@xyflow/react](https://reactflow.dev/) (Workflow
Editor), [hls.js](https://github.com/video-dev/hls.js) (camera HLS
streams), `<model-viewer>` via CDN (optional AR demo), PapaParse (CSV
import).

**Backend** (`server/`) — Node + Express + `better-sqlite3`, JWT auth/RBAC,
a WebSocket relay for AIS, and a "feeds" module that proxies every external
API server-side (keeps API keys out of the browser and avoids CORS).

## Getting started

You need **both** the backend and frontend running.

```bash
# Terminal 1 — backend
cd server
npm install
npm run dev      # http://localhost:8787

# Terminal 2 — frontend
npm install
npm run dev       # http://localhost:5173
```

Open `http://localhost:5173` and sign in. The app is gated behind login —
the backend seeds three demo accounts on first run:

| Username  | Password    | Role    | Clearance |
|-----------|-------------|---------|-----------|
| `admin`   | `admin123`  | Admin   | 3 (sees everything) |
| `analyst` | `analyst123`| Analyst | 2 |
| `viewer`  | `viewer123` | Viewer  | 1 (read-only, lowest clearance) |

Objects above a user's clearance are hidden from the UI, and write actions
(Import Data, Kill Chain tasking, Sensor Tasking) are disabled for `Viewer`
and enforced server-side via `requireRole` for `Analyst`/`Admin`.

Other frontend scripts:

```bash
npm run build    # type-check and produce a production build in dist/
npm run preview  # preview the production build locally
npm run lint     # run ESLint
```

### Backend `.env` variables (`server/.env`)

```
PORT=8787
JWT_SECRET=...                  # any long random string

# OpenSky Network OAuth2 client credentials — https://opensky-network.org/apidoc/rest.html#authentication
# Leave blank to fall back to OpenSky's heavily-rate-limited anonymous access.
OPENSKY_CLIENT_ID=
OPENSKY_CLIENT_SECRET=

# AISStream.io API key — https://aisstream.io/ — leave blank to disable the live ships layer
AISSTREAM_API_KEY=

# NWS api.weather.gov requires a descriptive User-Agent identifying your app + contact
NWS_USER_AGENT=GothamSim (your-project, you@example.com)

# Optional: a public 511/DOT traffic camera GeoJSON feed (e.g. Virginia's
# VDOT 511 dataset — see 511virginia.org / openva.com "VDOT 511 Geodata").
# Leave blank to fall back to the local src/data/cameras.json file.
CAMERAS_FEED_URL=
```

**Earthquakes (USGS), Satellites (Celestrak), Natural Events (NASA EONET),
Weather Alerts/Radar (NOAA/NWS, RainViewer), and the optional GDELT OSINT
layer are all keyless — no signup required.** Only the Aircraft (OpenSky)
and Ships (AISStream) layers need free API credentials; without them those
two layers simply show as disabled/anonymous-rate-limited in the Live Feeds
panel, everything else still works.

Copy `server/.env.example` to `server/.env` and fill in what you have.

## Live data layer (Part A)

Backend feed endpoints (`server/src/feeds/*.js`, mounted under
`/api/feeds`, all `requireAuth`, all cached 10s–5min to respect rate
limits):

| Endpoint | Source | Notes |
|---|---|---|
| `GET /api/feeds/aircraft` | OpenSky Network | bbox query params, OAuth2 client-credentials token cached ~30min |
| `GET /api/feeds/satellites` | Celestrak (TLE) + satellite.js | live positions + ground tracks |
| `GET /api/feeds/satellite-passes` | Celestrak + satellite.js | pass prediction for Sensor Tasking |
| `GET /api/feeds/earthquakes` | USGS | `?window=hour\|day` |
| `GET /api/feeds/events` | NASA EONET v3 | wildfires, storms, volcanoes, icebergs |
| `GET /api/feeds/weather-alerts` | NOAA/NWS | active alert polygons |
| `GET /api/feeds/radar-frames` | RainViewer | tile frame index |
| `GET /api/feeds/cameras` | configurable 511/DOT feed, falls back to `src/data/cameras.json` | normalized `{name,lat,lng,kind,url}` |
| `GET /api/feeds/osint-events` | GDELT GEO 2.0 (optional) | unverified open-news clustering |
| `WS /ws/ais` | AISStream.io | backend relays a single upstream connection to all browser clients |

Frontend hooks (`src/hooks/useLiveFeeds.ts`, `useAisFeed.ts`,
`useGdeltFeed.ts`) poll these and merge results into the shared
`useObjectStore`, tagged `source: "live"`. The **Live Feeds panel** (toggle
via the map's "Live Feeds" button) shows a `LIVE • <source> • updated Ns
ago` chip per layer and lets you turn each one (and the sample dataset) on
or off independently. An attribution footer credits every data source, as
required by OpenSky's terms.

Map/Network Graph/Data/Search/Timeline read `useVisibleEntities()` (sample
∪ live, clearance-filtered, **excludes simulator data**). The Kill Chain
view reads `useSimulatorAssets()` (simulator only).

## Planning & security layer (Part B)

- **Kill Chain / Task Planner** (`/killchain`) — the simulator described
  above: target + 3 aimpoints, an asset list with match scoring, a MapLibre
  tactical map (range rings, fictional tracks, flight paths, compass + UTC
  clock), a Gantt-style tasking timeline, and a tasking detail panel that
  posts mock entries to `POST /api/tasks`.
- **Workflow Editor** (`/workflow`) — a static `@xyflow/react` pipeline
  (Detect → Identify → Track → Plan → Task → Assess) with live counts
  pulled from the shared store; read-only visualization, no new state
  machine.
- **Sensor & Satellite Tasking** (`/sensor-tasking`) — pick a target +
  time window, predict real satellite passes via Celestrak/satellite.js,
  and "task" one — which only creates a mock imaging-request row (clearly
  labeled; it cannot control any real satellite).
- **Field Mode** (linked from Settings, no nav-rail entry) — a
  mobile-responsive map view plus an optional AR demo (`<model-viewer ar>`,
  loaded via CDN) that drops a placeholder 3D marker through your phone's
  camera. Clearly marked as an optional/demo feature.
- **RBAC** — SQLite-backed users/roles/clearance (`server/src/db.js`),
  JWT auth (`server/src/auth.js`), `requireRole` on write endpoints, and
  client-side clearance filtering + disabled write-actions for `Viewer`.

## Project structure

```
src/
  components/
    shell/      # ClassificationBanner, TitleBar, IconRail, TimelinePanel, AppShell, AttributionFooter
    map/        # Globe3D, Map2D, MapToggle, EntityMarkersLayer, CameraLayer, SatelliteGroundTrackLayer,
                # WeatherAlertsLayer, RadarTileLayer, DrawToolbar, MapContext
    graph/      # GraphToolbar, GraphLegend, GraphBottomTabs
    killchain/  # TargetPanel, AssetPanel, TacticalMap, TaskingGantt, TaskingDetailPanel
    panels/     # TaskAssetPanel, EntityDetailPanel, ImportModal, LiveFeedsPanel
    live/       # LiveFeedsController (mounts all live-feed hooks once, app-wide)
    field/      # ArDrop (optional AR demo)
  views/        # MapView, NetworkGraphView, KillChainView, WorkflowView, SensorTaskingView,
                # DataView, SearchView, HistoryView, FieldView, LoginView, SettingsView
  store/        # useObjectStore (entities/links, persisted, + useVisibleEntities/useSimulatorAssets
                # selectors), useAuthStore, useUIStore, useTimelineStore, useLiveRawStore
  hooks/        # usePolling, useLiveFeeds, useAisFeed, useGdeltFeed
  data/         # entities.json, cameras.json, taskAssets.json, seedGraphData.ts, simulatorAssets.ts
  lib/          # api.ts/apiBase.ts (backend client), navigation, color palettes, entity/category visuals
  types/        # ontology.ts (shared entity/link types incl. source/clearanceLevel), camera.ts, model-viewer.d.ts

server/
  src/
    feeds/      # opensky.js, satellites.js, earthquakes.js, eonet.js, nws.js, rainviewer.js, cameras.js, gdelt.js, cache.js
    routes/     # auth.js, feeds.js, tasks.js, objects.js
    auth.js, db.js, aisRelay.js, index.js
```

## Extending

- Add more fictional sample data in `src/data/seedGraphData.ts`, or use
  the in-app **Import Data** flow (CSV/JSON) on the Data view.
- Edit `src/data/cameras.json` (or set `CAMERAS_FEED_URL`) to point at a
  real public 511/DOT camera feed — see 511virginia.org / openva.com's
  "VDOT 511 Geodata" for an example. Other states/cities publish similar
  feeds.
- Add a new view: create a component in `src/views/`, add a route in
  `src/App.tsx`, and add an entry to `NAV_ITEMS` in `src/lib/navigation.ts`.
- Swap the 2D basemap style by changing `STYLE_URL` in
  `src/components/map/Map2D.tsx`.
- The object model (`useObjectStore`) persists `entities`/`links`/
  `sampleDatasetEnabled`/`categoryColorOverrides` to `localStorage` under
  `gotham-sim-object-store` (live entities are intentionally *not*
  persisted). Bump `version` and adjust `migrate` if you change the shape
  of `GraphEntity`/`GraphLink`.
- The auth session (`gotham-sim-auth`) persists only `{token, user}`.
=======
# GothamSIM
Simulated Gotham software (Palantir).
