import { create } from "zustand";
import { persist } from "zustand/middleware";
import { buildSeedGraph } from "../data/seedGraphData";
import { buildSimulatorEntities } from "../data/simulatorAssets";
import { useAuthStore } from "./useAuthStore";
import type { GraphEntity, GraphLink } from "../types/ontology";

function buildInitialGraph() {
  const seed = buildSeedGraph();
  return {
    entities: [...seed.entities, ...buildSimulatorEntities()],
    links: seed.links,
  };
}

interface ObjectState {
  entities: GraphEntity[];
  links: GraphLink[];
  /** Live feed results, keyed by layer (aircraft/ships/satellites/...). Not persisted. */
  liveEntitiesByLayer: Record<string, GraphEntity[]>;
  sampleDatasetEnabled: boolean;
  selectedIds: string[];
  categoryColorOverrides: Record<string, string>;
  setSelection: (ids: string[]) => void;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  addEntities: (entities: GraphEntity[]) => void;
  addLinks: (links: GraphLink[]) => void;
  setLiveEntities: (layer: string, entities: GraphEntity[]) => void;
  setSampleDatasetEnabled: (enabled: boolean) => void;
  setCategoryColor: (category: string, color: string) => void;
  resetDemoData: () => void;
}

export const useObjectStore = create<ObjectState>()(
  persist(
    (set) => ({
      ...buildInitialGraph(),
      liveEntitiesByLayer: {},
      sampleDatasetEnabled: true,
      selectedIds: [],
      categoryColorOverrides: {},
      setSelection: (ids) => set({ selectedIds: ids }),
      toggleSelect: (id) =>
        set((s) => ({
          selectedIds: s.selectedIds.includes(id)
            ? s.selectedIds.filter((x) => x !== id)
            : [...s.selectedIds, id],
        })),
      clearSelection: () => set({ selectedIds: [] }),
      addEntities: (newEntities) =>
        set((s) => ({
          entities: [
            ...s.entities,
            ...newEntities.filter(
              (e) => !s.entities.some((existing) => existing.id === e.id),
            ),
          ],
        })),
      addLinks: (newLinks) => set((s) => ({ links: [...s.links, ...newLinks] })),
      setLiveEntities: (layer, entities) =>
        set((s) => ({
          liveEntitiesByLayer: { ...s.liveEntitiesByLayer, [layer]: entities },
        })),
      setSampleDatasetEnabled: (enabled) => set({ sampleDatasetEnabled: enabled }),
      setCategoryColor: (category, color) =>
        set((s) => ({
          categoryColorOverrides: { ...s.categoryColorOverrides, [category]: color },
        })),
      resetDemoData: () => set({ ...buildInitialGraph(), selectedIds: [] }),
    }),
    {
      name: "gotham-sim-object-store",
      version: 3,
      partialize: (s) => ({
        entities: s.entities,
        links: s.links,
        sampleDatasetEnabled: s.sampleDatasetEnabled,
        categoryColorOverrides: s.categoryColorOverrides,
      }),
      migrate: () => ({
        ...buildInitialGraph(),
        liveEntitiesByLayer: {},
        sampleDatasetEnabled: true,
        selectedIds: [],
        categoryColorOverrides: {},
      }),
    },
  ),
);

export function useSelectedEntities(): GraphEntity[] {
  const entities = useObjectStore((s) => s.entities);
  const selectedIds = useObjectStore((s) => s.selectedIds);
  return entities.filter((e) => selectedIds.includes(e.id));
}

/**
 * Map / Network Graph / Data / Search / Timeline read this: sample (if
 * toggled) + live entities, clearance-filtered, simulator data excluded.
 */
export function useVisibleEntities(): GraphEntity[] {
  const entities = useObjectStore((s) => s.entities);
  const liveEntitiesByLayer = useObjectStore((s) => s.liveEntitiesByLayer);
  const sampleDatasetEnabled = useObjectStore((s) => s.sampleDatasetEnabled);
  const clearance = useAuthStore((s) => s.user?.clearance ?? 1);

  const sample = sampleDatasetEnabled
    ? entities.filter((e) => e.source === "sample")
    : [];
  const live = Object.values(liveEntitiesByLayer).flat();

  return [...sample, ...live].filter((e) => e.clearanceLevel <= clearance);
}

/** Kill Chain reads ONLY this — fictional simulator assets, never live-tracked entities. */
export function useSimulatorAssets(): GraphEntity[] {
  const entities = useObjectStore((s) => s.entities);
  const clearance = useAuthStore((s) => s.user?.clearance ?? 1);
  return entities.filter((e) => e.source === "simulator" && e.clearanceLevel <= clearance);
}
