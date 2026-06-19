import type { EntityStatus, EntityType } from "../types/ontology";
import { QUALITATIVE_PALETTE } from "./colorPalette";

export const ENTITY_COLOR: Record<EntityType, string> = {
  Person: QUALITATIVE_PALETTE[0],
  Vehicle: QUALITATIVE_PALETTE[1],
  Vessel: QUALITATIVE_PALETTE[2],
  Aircraft: QUALITATIVE_PALETTE[3],
  Facility: QUALITATIVE_PALETTE[4],
  Event: QUALITATIVE_PALETTE[5],
  Sensor: QUALITATIVE_PALETTE[6],
  Satellite: "#67e8f9",
};

export const ENTITY_LABEL: Record<EntityType, string> = {
  Person: "Person",
  Vehicle: "Vehicle",
  Vessel: "Vessel",
  Aircraft: "Aircraft",
  Facility: "Facility",
  Event: "Event",
  Sensor: "Sensor",
  Satellite: "Satellite",
};

export const STATUS_COLOR: Record<EntityStatus, string> = {
  active: "#10b981",
  standby: "#f59e0b",
  lost_contact: "#ec4899",
  unknown: "#5a6675",
};

export const STATUS_LABEL: Record<EntityStatus, string> = {
  active: "Active",
  standby: "Standby",
  lost_contact: "Lost Contact",
  unknown: "Unknown",
};
