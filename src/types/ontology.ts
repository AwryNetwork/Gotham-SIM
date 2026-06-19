export type EntityType =
  | "Person"
  | "Vehicle"
  | "Vessel"
  | "Aircraft"
  | "Satellite"
  | "Facility"
  | "Event"
  | "Sensor";

export type LinkType =
  | "located-at"
  | "owns"
  | "communicated-with"
  | "tasked-by"
  | "member-of";

export type EntityStatus = "active" | "standby" | "lost_contact" | "unknown";

/**
 * "live" = real open-source feed data, "sample" = bundled fictional demo
 * data, "simulator" = the Kill Chain's own fictional asset/target dataset.
 * Map/Network Graph/Data/Search/Timeline show live+sample only; Kill Chain
 * shows simulator only. See useObjectStore's useVisibleEntities /
 * useSimulatorAssets selectors.
 */
export type EntitySource = "live" | "sample" | "simulator";

/** 1=Viewer-visible, 2=Analyst+, 3=Admin-only — mirrors backend user.clearance. */
export type ClearanceLevel = 1 | 2 | 3;

export interface GraphEntity {
  id: string;
  type: EntityType;
  category: string;
  name: string;
  lat?: number;
  lng?: number;
  altitudeKm?: number;
  headingDeg?: number;
  speedKn?: number;
  status: EntityStatus;
  affiliation: string;
  classification: string;
  source: EntitySource;
  clearanceLevel: ClearanceLevel;
  description: string;
  lastUpdate: string;
  properties?: Record<string, string | number>;
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  type: LinkType;
  label?: string;
}

export const ENTITY_TYPES: EntityType[] = [
  "Person",
  "Vehicle",
  "Vessel",
  "Aircraft",
  "Satellite",
  "Facility",
  "Event",
  "Sensor",
];

export const LINK_TYPES: LinkType[] = [
  "located-at",
  "owns",
  "communicated-with",
  "tasked-by",
  "member-of",
];
