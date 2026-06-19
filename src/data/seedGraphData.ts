import legacyEntities from "./entities.json";
import type { ClearanceLevel, EntityType, GraphEntity, GraphLink } from "../types/ontology";

interface LegacyEntity {
  id: string;
  name: string;
  type: "satellite" | "ship" | "aircraft" | "ground_site";
  lat: number;
  lng: number;
  altitudeKm?: number;
  headingDeg?: number;
  speedKn?: number;
  status: GraphEntity["status"];
  affiliation: string;
  description: string;
  lastUpdate: string;
}

const LEGACY_TYPE_MAP: Record<LegacyEntity["type"], EntityType> = {
  satellite: "Satellite",
  ship: "Vessel",
  aircraft: "Aircraft",
  ground_site: "Facility",
};

// Ground sites are tagged more sensitive than tracks to give the RBAC demo
// something real to hide from lower-clearance roles.
const LEGACY_CLEARANCE: Record<LegacyEntity["type"], ClearanceLevel> = {
  satellite: 1,
  ship: 1,
  aircraft: 1,
  ground_site: 2,
};

function classificationLabel(level: ClearanceLevel): string {
  return level === 3
    ? "TOP SECRET // SAMPLE DATA"
    : level === 2
      ? "SECRET // SAMPLE DATA"
      : "UNCLASSIFIED // SAMPLE DATA";
}

interface CategorySpec {
  name: string;
  count: number;
  type: EntityType;
  affiliation: string;
  clearanceLevel: ClearanceLevel;
}

const CATEGORY_SPECS: CategorySpec[] = [
  { name: "GCSS-A", count: 4, type: "Vehicle", affiliation: "NOTIONAL LOGISTICS SYSTEM RECORD", clearanceLevel: 1 },
  { name: "FMS", count: 24, type: "Vehicle", affiliation: "NOTIONAL FOREIGN SALES CASE FILE", clearanceLevel: 2 },
  { name: "DTMS", count: 10, type: "Person", affiliation: "NOTIONAL TRAINING MANAGEMENT RECORD", clearanceLevel: 1 },
  { name: "ATRRS", count: 16, type: "Person", affiliation: "NOTIONAL TRAINING REQUIREMENTS RECORD", clearanceLevel: 1 },
  { name: "TAPDB", count: 60, type: "Person", affiliation: "NOTIONAL PERSONNEL DATABASE RECORD", clearanceLevel: 2 },
  { name: "MEDPROS", count: 18, type: "Person", affiliation: "NOTIONAL MEDICAL READINESS RECORD", clearanceLevel: 3 },
];

function mulberry32(seed: number) {
  let s = seed;
  return function rand() {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildSeedGraph(): { entities: GraphEntity[]; links: GraphLink[] } {
  const rand = mulberry32(20260618);
  const entities: GraphEntity[] = [];
  const links: GraphLink[] = [];
  let linkSeq = 0;
  const nextLinkId = () => `lnk-${String(linkSeq++).padStart(4, "0")}`;

  const integrationEntities: GraphEntity[] = (legacyEntities as LegacyEntity[]).map((e) => ({
    id: e.id,
    type: LEGACY_TYPE_MAP[e.type],
    category: "Integration",
    name: e.name,
    lat: e.lat,
    lng: e.lng,
    altitudeKm: e.altitudeKm,
    headingDeg: e.headingDeg,
    speedKn: e.speedKn,
    status: e.status,
    affiliation: e.affiliation,
    classification: classificationLabel(LEGACY_CLEARANCE[e.type]),
    source: "sample",
    clearanceLevel: LEGACY_CLEARANCE[e.type],
    description: e.description,
    lastUpdate: e.lastUpdate,
  }));
  entities.push(...integrationEntities);

  for (const spec of CATEGORY_SPECS) {
    const hubId = `hub-${spec.name}`;
    entities.push({
      id: hubId,
      type: spec.type,
      category: spec.name,
      name: `${spec.name} HUB`,
      status: "active",
      affiliation: spec.affiliation,
      classification: classificationLabel(spec.clearanceLevel),
      source: "sample",
      clearanceLevel: spec.clearanceLevel,
      description: `Fictional aggregation node representing the notional ${spec.name} source-system feed.`,
      lastUpdate: "2026-06-18T00:00:00Z",
    });

    const hubLinkCount = 2 + Math.floor(rand() * 2);
    for (let i = 0; i < hubLinkCount; i++) {
      const target = integrationEntities[Math.floor(rand() * integrationEntities.length)];
      links.push({ id: nextLinkId(), source: hubId, target: target.id, type: "tasked-by" });
    }

    for (let i = 0; i < spec.count; i++) {
      const id = `${spec.name.toLowerCase()}-${String(i + 1).padStart(3, "0")}`;
      const statusRoll = rand();
      entities.push({
        id,
        type: spec.type,
        category: spec.name,
        name: `${spec.name}-${String(i + 1).padStart(3, "0")}`,
        status: statusRoll > 0.92 ? "lost_contact" : statusRoll > 0.8 ? "standby" : "active",
        affiliation: spec.affiliation,
        classification: classificationLabel(spec.clearanceLevel),
        source: "sample",
        clearanceLevel: spec.clearanceLevel,
        description: `Fictional ${spec.name} source-system record. Sample data for simulation only.`,
        lastUpdate: new Date(
          Date.UTC(2026, 5, 17, Math.floor(rand() * 24), Math.floor(rand() * 60)),
        ).toISOString(),
      });
      links.push({ id: nextLinkId(), source: id, target: hubId, type: "member-of" });

      if (rand() > 0.8) {
        const target = integrationEntities[Math.floor(rand() * integrationEntities.length)];
        links.push({ id: nextLinkId(), source: id, target: target.id, type: "located-at" });
      }
    }
  }

  return { entities, links };
}
