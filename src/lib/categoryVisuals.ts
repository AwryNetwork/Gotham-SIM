import { QUALITATIVE_PALETTE } from "./colorPalette";

export const CATEGORIES = [
  "GCSS-A",
  "FMS",
  "DTMS",
  "ATRRS",
  "TAPDB",
  "MEDPROS",
  "Integration",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const DEFAULT_CATEGORY_COLOR: Record<Category, string> = {
  "GCSS-A": QUALITATIVE_PALETTE[0],
  FMS: QUALITATIVE_PALETTE[1],
  DTMS: QUALITATIVE_PALETTE[2],
  ATRRS: QUALITATIVE_PALETTE[3],
  TAPDB: QUALITATIVE_PALETTE[4],
  MEDPROS: QUALITATIVE_PALETTE[5],
  Integration: QUALITATIVE_PALETTE[6],
};
