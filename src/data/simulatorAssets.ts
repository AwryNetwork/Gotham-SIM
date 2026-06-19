import type { GraphEntity } from "../types/ontology";

/**
 * Fictional Kill Chain / Task Planner dataset. This is the ONLY data the
 * simulator reads — it never touches live-tracked entities. Everything
 * here is notional: aimpoints, asset positions, payloads, and the match
 * score are placeholder numbers for UI demonstration only, not real
 * targeting logic or weaponeering.
 */

export type AssetBranch = "Air" | "Surface" | "Land";

export interface AssetPayload {
  label: string;
  count: number;
}

export interface SimulatorAsset {
  id: string;
  callsign: string;
  branch: AssetBranch;
  isMine: boolean;
  lat: number;
  lng: number;
  headingDeg: number;
  trackLabel: string;
  payloads: AssetPayload[];
  distanceNm: number;
  fuelRemainingPct: number;
  timeOnStationHr: number;
  timeToTargetMin: number;
  munitions: string;
  atoMission: string;
  assetsAvailable: number;
  missionTasks: string[];
}

export interface Aimpoint {
  id: string;
  label: string;
  coordinate: string;
}

export const SIMULATOR_TARGET = {
  id: "sim-target-1",
  name: "Notional Transloading Facility — Multi-Point Target",
  priorityTag: "PRIORITY 1 // NOTIONAL",
  lat: 34.02,
  lng: 44.31,
  aimpoints: [
    { id: "ap-1", label: "AIMPOINT 1 — Loading Apron", coordinate: "34°01'12\"N 044°18'40\"E" },
    { id: "ap-2", label: "AIMPOINT 2 — Rail Spur Junction", coordinate: "34°01'48\"N 044°19'02\"E" },
    { id: "ap-3", label: "AIMPOINT 3 — Storage Array C", coordinate: "34°02'21\"N 044°19'31\"E" },
  ] satisfies Aimpoint[],
};

export const SIMULATOR_ASSETS: SimulatorAsset[] = [
  {
    id: "sim-air-1",
    callsign: "VAPOR 14",
    branch: "Air",
    isMine: true,
    lat: 33.4,
    lng: 42.6,
    headingDeg: 64,
    trackLabel: "VAPOR 14",
    payloads: [{ label: "Type-A", count: 24 }, { label: "Type-C", count: 2 }],
    distanceNm: 86,
    fuelRemainingPct: 71,
    timeOnStationHr: 2.4,
    timeToTargetMin: 12,
    munitions: "Type-A (24x), Type-C (2x)",
    atoMission: "ATO-NOTIONAL-0417",
    assetsAvailable: 3,
    missionTasks: ["Hold CAP NORTH", "Standby strike tasking", "Report fuel state at +30"],
  },
  {
    id: "sim-air-2",
    callsign: "E-8C SENTRY 2",
    branch: "Air",
    isMine: true,
    lat: 34.9,
    lng: 45.8,
    headingDeg: 210,
    trackLabel: "SENTRY 2",
    payloads: [{ label: "E-8C", count: 1 }],
    distanceNm: 142,
    fuelRemainingPct: 88,
    timeOnStationHr: 4.1,
    timeToTargetMin: 22,
    munitions: "E-8C (1x) — C2/ISR, unarmed",
    atoMission: "ATO-NOTIONAL-0402",
    assetsAvailable: 1,
    missionTasks: ["Maintain track on AOI", "Relay tasking to VAPOR flight"],
  },
  {
    id: "sim-air-3",
    callsign: "RAPTOR 09",
    branch: "Air",
    isMine: false,
    lat: 31.1,
    lng: 40.2,
    headingDeg: 350,
    trackLabel: "RAPTOR 09",
    payloads: [{ label: "Type-A", count: 6 }],
    distanceNm: 264,
    fuelRemainingPct: 54,
    timeOnStationHr: 1.1,
    timeToTargetMin: 41,
    munitions: "Type-A (6x)",
    atoMission: "ATO-NOTIONAL-0411",
    assetsAvailable: 2,
    missionTasks: ["Transit to AOI", "Awaiting tasking"],
  },
  {
    id: "sim-surf-1",
    callsign: "DDG NOTIONAL 88",
    branch: "Surface",
    isMine: true,
    lat: 29.6,
    lng: 48.9,
    headingDeg: 305,
    trackLabel: "DDG-88",
    payloads: [{ label: "Type-B (VLS)", count: 40 }],
    distanceNm: 318,
    fuelRemainingPct: 92,
    timeOnStationHr: 11.6,
    timeToTargetMin: 58,
    munitions: "Type-B VLS (40x)",
    atoMission: "ATO-NOTIONAL-0390",
    assetsAvailable: 1,
    missionTasks: ["Maintain station Persian Gulf North", "Air defense watch"],
  },
  {
    id: "sim-surf-2",
    callsign: "FFG NOTIONAL 14",
    branch: "Surface",
    isMine: false,
    lat: 26.8,
    lng: 51.2,
    headingDeg: 280,
    trackLabel: "FFG-14",
    payloads: [{ label: "Type-B (VLS)", count: 16 }],
    distanceNm: 402,
    fuelRemainingPct: 67,
    timeOnStationHr: 6.3,
    timeToTargetMin: 84,
    munitions: "Type-B VLS (16x)",
    atoMission: "ATO-NOTIONAL-0388",
    assetsAvailable: 1,
    missionTasks: ["Escort duty", "Standby tasking"],
  },
  {
    id: "sim-land-1",
    callsign: "BTRY NOTIONAL 3",
    branch: "Land",
    isMine: true,
    lat: 33.9,
    lng: 43.7,
    headingDeg: 90,
    trackLabel: "BTRY-3",
    payloads: [{ label: "Type-D (Rocket)", count: 12 }],
    distanceNm: 28,
    fuelRemainingPct: 100,
    timeOnStationHr: 18.2,
    timeToTargetMin: 6,
    munitions: "Type-D Rocket (12x)",
    atoMission: "ATO-NOTIONAL-0421",
    assetsAvailable: 2,
    missionTasks: ["Hold fire position", "Awaiting clearance"],
  },
  {
    id: "sim-land-2",
    callsign: "TF NOTIONAL HAMMER",
    branch: "Land",
    isMine: false,
    lat: 35.2,
    lng: 46.1,
    headingDeg: 230,
    trackLabel: "TF HAMMER",
    payloads: [{ label: "Type-D (Rocket)", count: 4 }],
    distanceNm: 95,
    fuelRemainingPct: 78,
    timeOnStationHr: 9.4,
    timeToTargetMin: 33,
    munitions: "Type-D Rocket (4x)",
    atoMission: "ATO-NOTIONAL-0419",
    assetsAvailable: 1,
    missionTasks: ["Repositioning", "Standby tasking"],
  },
];

/**
 * Notional match score: a simple weighted function over fictional
 * distance + fuel/availability + payload count. NOT real targeting logic —
 * purely a UI demonstration of how an asset list might be ranked.
 */
export function computeMatchScore(asset: SimulatorAsset): number {
  const distanceScore = Math.max(0, 100 - asset.distanceNm / 4);
  const availabilityScore = (asset.fuelRemainingPct + asset.assetsAvailable * 15) / 1.5;
  const payloadCount = asset.payloads.reduce((sum, p) => sum + p.count, 0);
  const payloadScore = Math.min(100, payloadCount * 2.5);
  const score = distanceScore * 0.45 + availabilityScore * 0.35 + payloadScore * 0.2;
  return Math.round(Math.min(100, Math.max(0, score)));
}

export type MatchBadge = "TOP MATCH" | "FAIR MATCH" | null;

export function matchBadgeFor(score: number): MatchBadge {
  if (score >= 70) return "TOP MATCH";
  if (score >= 45) return "FAIR MATCH";
  return null;
}

export interface ProposedTaskingBar {
  id: string;
  assetCallsign: string;
  taskType: string;
  startHourUtc: number;
  durationHr: number;
}

export const PROPOSED_TASKING: ProposedTaskingBar[] = [
  { id: "tsk-1", assetCallsign: "VAPOR 14", taskType: "Strike Window", startHourUtc: 6, durationHr: 1.5 },
  { id: "tsk-2", assetCallsign: "E-8C SENTRY 2", taskType: "ISR Track", startHourUtc: 4, durationHr: 6 },
  { id: "tsk-3", assetCallsign: "DDG NOTIONAL 88", taskType: "Standby Strike", startHourUtc: 8, durationHr: 3 },
  { id: "tsk-4", assetCallsign: "BTRY NOTIONAL 3", taskType: "Fire Mission", startHourUtc: 7, durationHr: 0.5 },
  { id: "tsk-5", assetCallsign: "RAPTOR 09", taskType: "CAS Alert", startHourUtc: 9, durationHr: 2 },
];

const BRANCH_TO_ENTITY_TYPE = {
  Air: "Aircraft",
  Surface: "Vessel",
  Land: "Vehicle",
} as const;

/** Projects the simulator dataset into the shared object model, tagged source:"simulator". */
export function buildSimulatorEntities(): GraphEntity[] {
  const target: GraphEntity = {
    id: SIMULATOR_TARGET.id,
    type: "Facility",
    category: "Kill Chain Target",
    name: SIMULATOR_TARGET.name,
    lat: SIMULATOR_TARGET.lat,
    lng: SIMULATOR_TARGET.lng,
    status: "active",
    affiliation: "NOTIONAL OPFOR INFRASTRUCTURE",
    classification: "SIMULATED // NOTIONAL DATA",
    source: "simulator",
    clearanceLevel: 2,
    description: "Fictional multi-point target generated for the Kill Chain simulator only.",
    lastUpdate: new Date().toISOString(),
  };

  const assets: GraphEntity[] = SIMULATOR_ASSETS.map((a) => ({
    id: a.id,
    type: BRANCH_TO_ENTITY_TYPE[a.branch],
    category: "Kill Chain Asset",
    name: a.callsign,
    lat: a.lat,
    lng: a.lng,
    headingDeg: a.headingDeg,
    status: "active",
    affiliation: a.isMine ? "MY ASSETS" : "COALITION ASSETS",
    classification: "SIMULATED // NOTIONAL DATA",
    source: "simulator",
    clearanceLevel: 2,
    description: `Fictional ${a.branch.toLowerCase()} asset, ATO mission ${a.atoMission}. Simulator data only.`,
    lastUpdate: new Date().toISOString(),
  }));

  return [target, ...assets];
}
