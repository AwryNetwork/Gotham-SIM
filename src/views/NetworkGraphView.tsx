import { useEffect, useMemo, useRef, useState } from "react";
import cytoscape, { type Core, type EdgeDefinition, type NodeDefinition } from "cytoscape";
import { Plus, Minus, Maximize } from "lucide-react";
import { ensureCytoscapeExtensionsRegistered } from "../lib/cytoscapeRegister";
import { useObjectStore, useSelectedEntities, useVisibleEntities } from "../store/useObjectStore";
import { DEFAULT_CATEGORY_COLOR, type Category } from "../lib/categoryVisuals";
import type { GraphEntity, GraphLink } from "../types/ontology";
import { GraphToolbar, type LayoutName } from "../components/graph/GraphToolbar";
import { GraphLegend, type LegendRow } from "../components/graph/GraphLegend";
import { GraphBottomTabs } from "../components/graph/GraphBottomTabs";

ensureCytoscapeExtensionsRegistered();

const KNOWN_SOURCE_CATEGORIES = ["GCSS-A", "FMS", "DTMS", "ATRRS", "TAPDB", "MEDPROS"];

function isAutoVisible(entity: GraphEntity) {
  return (
    entity.category === "Integration" ||
    entity.id.startsWith("hub-") ||
    !KNOWN_SOURCE_CATEGORIES.includes(entity.category)
  );
}

function entityToNode(e: GraphEntity, color: string): NodeDefinition {
  return {
    data: { id: e.id, label: e.name, category: e.category, type: e.type, color, status: e.status },
  };
}

function linkToEdge(l: GraphLink): EdgeDefinition {
  return { data: { id: l.id, source: l.source, target: l.target, type: l.type } };
}

const STYLESHEET: cytoscape.StylesheetJsonBlock[] = [
  {
    selector: "node",
    style: {
      "background-color": "data(color)",
      label: "data(label)",
      color: "#8b98a9",
      "font-size": 7,
      "text-valign": "bottom",
      "text-margin-y": 4,
      width: 13,
      height: 13,
      "border-width": 1,
      "border-color": "rgba(255,255,255,0.18)",
    },
  },
  {
    selector: "node:selected",
    style: {
      "border-width": 3,
      "border-color": "#ffffff",
      "overlay-opacity": 0,
    },
  },
  {
    selector: "node[?isGroup]",
    style: {
      "background-color": "data(color)",
      "background-opacity": 0.07,
      "border-color": "#1e2835",
      "border-width": 1,
      label: "data(label)",
      color: "#5a6675",
      "font-size": 9,
      "text-valign": "top",
      "text-halign": "center",
      shape: "round-rectangle",
      padding: "16px",
    },
  },
  {
    selector: "edge",
    style: {
      width: 1,
      "line-color": "#1e2835",
      "line-style": "dashed",
      "curve-style": "bezier",
      "target-arrow-shape": "none",
      opacity: 0.8,
    },
  },
  {
    selector: "edge.flow",
    style: {
      "target-arrow-shape": "triangle",
      "target-arrow-color": "#2dd4bf",
      "line-color": "#2dd4bf",
      opacity: 0.9,
    },
  },
];

function colorFor(category: string, overrides: Record<string, string>) {
  return overrides[category] ?? DEFAULT_CATEGORY_COLOR[category as Category] ?? "#5a6675";
}

export function NetworkGraphView() {
  const entities = useVisibleEntities();
  const links = useObjectStore((s) => s.links);
  const selectedIds = useObjectStore((s) => s.selectedIds);
  const setSelection = useObjectStore((s) => s.setSelection);
  const categoryColorOverrides = useObjectStore((s) => s.categoryColorOverrides);
  const setCategoryColor = useObjectStore((s) => s.setCategoryColor);
  const selected = useSelectedEntities();

  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const entitiesRef = useRef(entities);
  const linksRef = useRef(links);
  const overridesRef = useRef(categoryColorOverrides);
  const layoutRef = useRef<LayoutName>("fcose");

  const undoStackRef = useRef<{ nodes: NodeDefinition[]; edges: EdgeDefinition[] }[]>([]);
  const redoStackRef = useRef<{ nodes: NodeDefinition[]; edges: EdgeDefinition[] }[]>([]);
  const prevEntityCountRef = useRef(0);
  const syncingRef = useRef(false);

  const [graphStats, setGraphStats] = useState({
    visibleNodeCount: 0,
    visibleEdgeCount: 0,
    visibleByCategory: new Map<string, number>(),
  });
  const [layout, setLayout] = useState<LayoutName>("fcose");
  const [groupByColor, setGroupByColor] = useState(false);
  const [selectModeActive, setSelectModeActive] = useState(false);
  const [flowMode, setFlowMode] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [findQuery, setFindQuery] = useState("");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [activityLog, setActivityLog] = useState<string[]>([]);

  function syncStats() {
    const cy = cyRef.current;
    if (!cy) return;
    const byCategory = new Map<string, number>();
    let nodeCount = 0;
    cy.nodes().forEach((n) => {
      if (n.data("isGroup")) return;
      nodeCount++;
      const cat = n.data("category") as string;
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + 1);
    });
    setGraphStats({
      visibleNodeCount: nodeCount,
      visibleEdgeCount: cy.edges().length,
      visibleByCategory: byCategory,
    });
  }
  const logActivity = (entry: string) => {
    const stamp = new Date().toLocaleTimeString("en-US", { hour12: false });
    setActivityLog((prev) => [...prev.slice(-49), `${stamp} — ${entry}`]);
  };

  useEffect(() => {
    entitiesRef.current = entities;
  }, [entities]);
  useEffect(() => {
    linksRef.current = links;
  }, [links]);
  useEffect(() => {
    overridesRef.current = categoryColorOverrides;
  }, [categoryColorOverrides]);
  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  function runLayout(name: LayoutName = layoutRef.current) {
    const cy = cyRef.current;
    if (!cy) return;
    const options: Record<string, unknown> = {
      name,
      animate: true,
      animationDuration: 350,
      fit: true,
      padding: 40,
    };
    if (name === "fcose") {
      options.quality = "default";
      options.randomize = true;
      options.nodeRepulsion = 4500;
      options.idealEdgeLength = 60;
    } else if (name === "concentric") {
      options.concentric = (n: cytoscape.NodeSingular) =>
        n.data("category") === "Integration" ? 10 : 1;
      options.levelWidth = () => 2;
    } else if (name === "breadthfirst") {
      options.directed = false;
    }
    cy.layout(options as unknown as cytoscape.LayoutOptions).run();
  }

  function ensureVisible(id: string): boolean {
    const cy = cyRef.current;
    if (!cy) return false;
    if (cy.getElementById(id).length > 0) return false;
    const entity = entitiesRef.current.find((e) => e.id === id);
    if (!entity) return false;
    cy.add(entityToNode(entity, colorFor(entity.category, overridesRef.current)));
    return true;
  }

  function wireNewEdges() {
    const cy = cyRef.current;
    if (!cy) return 0;
    const newEdges: EdgeDefinition[] = [];
    for (const l of linksRef.current) {
      if (cy.getElementById(l.id).length > 0) continue;
      if (cy.getElementById(l.source).length > 0 && cy.getElementById(l.target).length > 0) {
        newEdges.push(linkToEdge(l));
      }
    }
    if (newEdges.length) cy.add(newEdges);
    return newEdges.length;
  }

  function expandNode(id: string) {
    const cy = cyRef.current;
    if (!cy) return;
    const neighborIds = new Set<string>();
    for (const l of linksRef.current) {
      if (l.source === id) neighborIds.add(l.target);
      if (l.target === id) neighborIds.add(l.source);
    }
    let added = 0;
    neighborIds.forEach((nid) => {
      if (ensureVisible(nid)) added++;
    });
    const addedEdges = wireNewEdges();
    if (added || addedEdges) {
      const node = cy.getElementById(id);
      logActivity(`Expanded "${node.data("label")}" — +${added} nodes, +${addedEdges} links`);
      runLayout();
      syncStats();
    }
  }

  function removeByIds(ids: string[]) {
    const cy = cyRef.current;
    if (!cy || ids.length === 0) return;
    cy.remove(ids.map((id) => `#${id}`).join(","));
  }

  function removeSelected() {
    const cy = cyRef.current;
    if (!cy) return;
    const selectedNodes = cy.nodes(":selected");
    if (selectedNodes.length === 0) return;
    const removedNodes = selectedNodes.map((n) => ({ data: { ...n.data() } }));
    const removedEdges = selectedNodes.connectedEdges().map((e) => ({ data: { ...e.data() } }));
    undoStackRef.current.push({ nodes: removedNodes, edges: removedEdges });
    redoStackRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
    selectedNodes.remove();
    setSelection([]);
    logActivity(`Removed ${removedNodes.length} node(s) from view`);
    syncStats();
  }

  function undo() {
    const cy = cyRef.current;
    if (!cy || undoStackRef.current.length === 0) return;
    const last = undoStackRef.current.pop()!;
    redoStackRef.current.push(last);
    cy.add(last.nodes);
    cy.add(last.edges);
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(true);
    logActivity(`Undo: restored ${last.nodes.length} node(s)`);
    syncStats();
  }

  function redo() {
    const cy = cyRef.current;
    if (!cy || redoStackRef.current.length === 0) return;
    const next = redoStackRef.current.pop()!;
    undoStackRef.current.push(next);
    removeByIds(next.nodes.map((n) => n.data.id as string));
    setCanRedo(redoStackRef.current.length > 0);
    setCanUndo(true);
    logActivity(`Redo: removed ${next.nodes.length} node(s) again`);
    syncStats();
  }

  function clean() {
    const cy = cyRef.current;
    if (!cy) return;
    const isolated = cy.nodes().filter((n) => !n.data("isGroup") && n.degree(false) === 0);
    const count = isolated.length;
    isolated.remove();
    runLayout();
    cy.fit(undefined, 40);
    logActivity(`Clean: removed ${count} isolated node(s) and re-fit layout`);
    syncStats();
  }

  function alignSelected() {
    const cy = cyRef.current;
    if (!cy) return;
    const selectedNodes = cy.nodes(":selected");
    if (selectedNodes.length < 2) return;
    const avgY =
      selectedNodes.reduce((sum, n) => sum + n.position("y"), 0) / selectedNodes.length;
    selectedNodes.forEach((n) => {
      n.position("y", avgY);
    });
    logActivity(`Aligned ${selectedNodes.length} node(s) horizontally`);
  }

  function toggleGroupByColor() {
    const cy = cyRef.current;
    if (!cy) return;
    const next = !groupByColor;
    setGroupByColor(next);
    if (next) {
      const categories = new Set(
        cy.nodes().filter((n) => !n.data("isGroup")).map((n) => n.data("category") as string),
      );
      const toAdd: NodeDefinition[] = [];
      categories.forEach((cat) => {
        const parentId = `group:${cat}`;
        if (cy.getElementById(parentId).length === 0) {
          toAdd.push({
            data: { id: parentId, label: cat, isGroup: true, color: colorFor(cat, overridesRef.current) },
          });
        }
      });
      if (toAdd.length) cy.add(toAdd);
      cy.nodes().forEach((n) => {
        if (!n.data("isGroup")) n.move({ parent: `group:${n.data("category")}` });
      });
    } else {
      cy.nodes().forEach((n) => {
        if (!n.data("isGroup")) n.move({ parent: null });
      });
      cy.nodes("[?isGroup]").remove();
    }
    runLayout();
    syncStats();
  }

  function layoutByColor() {
    if (!groupByColor) toggleGroupByColor();
    else runLayout();
    logActivity("Layout by color applied");
  }

  function toggleFlow() {
    const cy = cyRef.current;
    if (!cy) return;
    const next = !flowMode;
    setFlowMode(next);
    if (next) cy.edges().addClass("flow");
    else cy.edges().removeClass("flow");
  }

  function toggleLabels() {
    const cy = cyRef.current;
    if (!cy) return;
    const next = !showLabels;
    setShowLabels(next);
    cy.style().selector("node").style({ label: next ? "data(label)" : "" }).update();
  }

  function toggleSelectMode() {
    const cy = cyRef.current;
    if (!cy) return;
    const next = !selectModeActive;
    setSelectModeActive(next);
    cy.boxSelectionEnabled(next);
  }

  function handleFindSubmit() {
    const q = findQuery.trim().toLowerCase();
    if (!q) return;
    const match = entitiesRef.current.find((e) => e.name.toLowerCase().includes(q));
    if (!match) {
      logActivity(`Find: no match for "${findQuery}"`);
      return;
    }
    ensureVisible(match.id);
    wireNewEdges();
    expandNode(match.id);
    setSelection([match.id]);
    const cy = cyRef.current;
    const node = cy?.getElementById(match.id);
    if (cy && node && node.length) {
      runLayout();
      cy.center(node);
    }
    logActivity(`Find: located "${match.name}"`);
  }

  function handleColorChange(category: string, color: string) {
    setCategoryColor(category, color);
  }

  // Init cytoscape once.
  useEffect(() => {
    if (!containerRef.current) return;
    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      style: STYLESHEET,
      wheelSensitivity: 0.25,
      boxSelectionEnabled: false,
    });
    cyRef.current = cy;
    prevEntityCountRef.current = 0;

    cy.on("tap", "node", (evt) => {
      if (evt.target.data("isGroup")) return;
      setSelection([evt.target.id()]);
    });
    cy.on("dbltap", "node", (evt) => {
      if (evt.target.data("isGroup")) return;
      expandNode(evt.target.id());
    });
    cy.on("select unselect", "node", () => {
      if (syncingRef.current) return;
      const ids = cy.nodes(":selected").filter((n) => !n.data("isGroup")).map((n) => n.id());
      setSelection(ids);
    });

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Populate / grow the graph whenever the shared object model changes.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    if (entities.length === prevEntityCountRef.current) return;

    const toAdd: NodeDefinition[] = [];
    for (const e of entities) {
      if (cy.getElementById(e.id).length > 0) continue;
      if (isAutoVisible(e)) toAdd.push(entityToNode(e, colorFor(e.category, categoryColorOverrides)));
    }
    if (toAdd.length) cy.add(toAdd);
    const addedEdges = wireNewEdges();

    if (toAdd.length || addedEdges) {
      runLayout();
      if (prevEntityCountRef.current > 0) {
        logActivity(`Ingested ${toAdd.length} new node(s) into the graph`);
      }
      syncStats();
    }
    prevEntityCountRef.current = entities.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entities, links]);

  // Recolor nodes when category color overrides change.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.nodes().forEach((n) => {
      const cat = n.data("category") as string;
      n.data("color", colorFor(cat, categoryColorOverrides));
    });
  }, [categoryColorOverrides]);

  // Cross-filter: external selection (e.g. from Map view) syncs into cytoscape.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    syncingRef.current = true;
    cy.nodes(":selected").unselect();
    selectedIds.forEach((id) => {
      const n = cy.getElementById(id);
      if (n.length) n.select();
    });
    syncingRef.current = false;
  }, [selectedIds]);

  const totalByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entities) map.set(e.category, (map.get(e.category) ?? 0) + 1);
    return map;
  }, [entities]);

  const legendRows: LegendRow[] = useMemo(
    () =>
      Array.from(totalByCategory.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([category, count]) => ({
          category,
          count,
          visibleCount: graphStats.visibleByCategory.get(category) ?? 0,
          color: colorFor(category, categoryColorOverrides),
        })),
    [totalByCategory, graphStats, categoryColorOverrides],
  );

  const categoryColors = useMemo(
    () => legendRows.map((r) => ({ category: r.category, color: r.color })),
    [legendRows],
  );

  const zoomBy = (factor: number) => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.zoom({
      level: cy.zoom() * factor,
      renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 },
    });
  };

  return (
    <div className="flex h-full flex-col">
      <GraphToolbar
        layout={layout}
        onLayoutChange={(name) => {
          setLayout(name);
          runLayout(name);
        }}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onClean={clean}
        selectModeActive={selectModeActive}
        onToggleSelectMode={toggleSelectMode}
        onExpandSelected={() => {
          const cy = cyRef.current;
          cy?.nodes(":selected").forEach((n) => expandNode(n.id()));
        }}
        onRemoveSelected={removeSelected}
        onAlignSelected={alignSelected}
        flowMode={flowMode}
        onToggleFlow={toggleFlow}
        showLabels={showLabels}
        onToggleLabels={toggleLabels}
        findQuery={findQuery}
        onFindChange={setFindQuery}
        onFindSubmit={handleFindSubmit}
        categoryColors={categoryColors}
        onColorChange={handleColorChange}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="relative flex-1">
          <div ref={containerRef} className="h-full w-full bg-bg-base" />

          <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1">
            <button
              type="button"
              title="Zoom in"
              onClick={() => zoomBy(1.25)}
              className="flex h-7 w-7 items-center justify-center rounded border border-border bg-bg-panel/90 text-text-secondary hover:text-text-primary"
            >
              <Plus size={14} />
            </button>
            <button
              type="button"
              title="Zoom out"
              onClick={() => zoomBy(0.8)}
              className="flex h-7 w-7 items-center justify-center rounded border border-border bg-bg-panel/90 text-text-secondary hover:text-text-primary"
            >
              <Minus size={14} />
            </button>
            <button
              type="button"
              title="Fit to view"
              onClick={() => cyRef.current?.fit(undefined, 40)}
              className="flex h-7 w-7 items-center justify-center rounded border border-border bg-bg-panel/90 text-text-secondary hover:text-text-primary"
            >
              <Maximize size={14} />
            </button>
          </div>
        </div>

        <GraphLegend
          rows={legendRows}
          groupByColor={groupByColor}
          onToggleGroupByColor={toggleGroupByColor}
          onLayoutByColor={layoutByColor}
          onColorChange={handleColorChange}
        />
      </div>

      <GraphBottomTabs
        visibleCount={graphStats.visibleNodeCount}
        totalCount={entities.length}
        edgeCount={graphStats.visibleEdgeCount}
        selected={selected}
        activityLog={activityLog}
        entities={entities}
      />
    </div>
  );
}
