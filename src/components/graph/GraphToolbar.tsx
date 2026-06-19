import { useState } from "react";
import {
  Wrench,
  LayoutGrid,
  Undo2,
  Redo2,
  Sparkles,
  MousePointer2,
  Maximize2,
  Palette,
  Search,
  Trash2,
  AlignHorizontalJustifyCenter,
  Workflow,
} from "lucide-react";

export type LayoutName = "fcose" | "concentric" | "grid" | "circle" | "breadthfirst";

interface CategoryColorRow {
  category: string;
  color: string;
}

interface GraphToolbarProps {
  layout: LayoutName;
  onLayoutChange: (name: LayoutName) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onClean: () => void;
  selectModeActive: boolean;
  onToggleSelectMode: () => void;
  onExpandSelected: () => void;
  onRemoveSelected: () => void;
  onAlignSelected: () => void;
  flowMode: boolean;
  onToggleFlow: () => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  findQuery: string;
  onFindChange: (q: string) => void;
  onFindSubmit: () => void;
  categoryColors: CategoryColorRow[];
  onColorChange: (category: string, color: string) => void;
}

const LAYOUTS: { value: LayoutName; label: string }[] = [
  { value: "fcose", label: "Force (fcose)" },
  { value: "concentric", label: "Concentric" },
  { value: "grid", label: "Grid" },
  { value: "circle", label: "Circle" },
  { value: "breadthfirst", label: "Breadth-first" },
];

function ToolbarButton({
  title,
  active,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={[
        "flex h-8 w-8 items-center justify-center rounded transition-colors",
        active
          ? "bg-accent-cyan/15 text-accent-cyan ring-1 ring-accent-cyan/40"
          : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function GraphToolbar(props: GraphToolbarProps) {
  const [toolsOpen, setToolsOpen] = useState(false);
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [findOpen, setFindOpen] = useState(false);

  const closePopovers = () => {
    setToolsOpen(false);
    setLayoutOpen(false);
    setColorOpen(false);
  };

  return (
    <div className="flex items-center gap-0.5 border-b border-border bg-bg-panel px-2 py-1.5">
      <div className="relative">
        <ToolbarButton
          title="Tools"
          active={toolsOpen}
          onClick={() => {
            closePopovers();
            setToolsOpen((v) => !v);
          }}
        >
          <Wrench size={15} />
        </ToolbarButton>
        {toolsOpen && (
          <div className="absolute left-0 top-9 z-20 w-48 rounded border border-border bg-bg-elevated p-2 shadow-lg">
            <label className="flex items-center gap-2 px-1 py-1.5 text-xs text-text-secondary">
              <input type="checkbox" checked={props.showLabels} onChange={props.onToggleLabels} />
              Show node labels
            </label>
          </div>
        )}
      </div>

      <div className="relative">
        <ToolbarButton
          title="Layout"
          active={layoutOpen}
          onClick={() => {
            closePopovers();
            setLayoutOpen((v) => !v);
          }}
        >
          <LayoutGrid size={15} />
        </ToolbarButton>
        {layoutOpen && (
          <div className="absolute left-0 top-9 z-20 w-44 rounded border border-border bg-bg-elevated p-1 shadow-lg">
            {LAYOUTS.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => {
                  props.onLayoutChange(l.value);
                  setLayoutOpen(false);
                }}
                className={[
                  "block w-full rounded px-2 py-1.5 text-left text-xs",
                  props.layout === l.value
                    ? "bg-accent-cyan/15 text-accent-cyan"
                    : "text-text-secondary hover:bg-bg-panel hover:text-text-primary",
                ].join(" ")}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mx-1 h-5 w-px bg-border" />

      <ToolbarButton title="Undo" onClick={props.onUndo}>
        <Undo2 size={15} className={props.canUndo ? "" : "opacity-30"} />
      </ToolbarButton>
      <ToolbarButton title="Redo" onClick={props.onRedo}>
        <Redo2 size={15} className={props.canRedo ? "" : "opacity-30"} />
      </ToolbarButton>
      <ToolbarButton title="Clean (re-fit & tidy layout)" onClick={props.onClean}>
        <Sparkles size={15} />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-border" />

      <ToolbarButton
        title="Select (box selection)"
        active={props.selectModeActive}
        onClick={props.onToggleSelectMode}
      >
        <MousePointer2 size={15} />
      </ToolbarButton>
      <ToolbarButton title="Expand selected node(s)" onClick={props.onExpandSelected}>
        <Maximize2 size={15} />
      </ToolbarButton>

      <div className="relative">
        <ToolbarButton
          title="Color"
          active={colorOpen}
          onClick={() => {
            closePopovers();
            setColorOpen((v) => !v);
          }}
        >
          <Palette size={15} />
        </ToolbarButton>
        {colorOpen && (
          <div className="absolute left-0 top-9 z-20 w-52 rounded border border-border bg-bg-elevated p-2 shadow-lg">
            <div className="label-section mb-1.5">Custom color</div>
            <div className="flex flex-col gap-1">
              {props.categoryColors.map((row) => (
                <div key={row.category} className="flex items-center justify-between gap-2 px-1 py-1">
                  <span className="text-[11px] text-text-secondary">{row.category}</span>
                  <span
                    className="relative inline-block h-3.5 w-3.5 rounded-sm"
                    style={{ backgroundColor: row.color }}
                  >
                    <input
                      type="color"
                      value={row.color}
                      onChange={(e) => props.onColorChange(row.category, e.target.value)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative flex items-center">
        <ToolbarButton
          title="Find"
          active={findOpen}
          onClick={() => setFindOpen((v) => !v)}
        >
          <Search size={15} />
        </ToolbarButton>
        {findOpen && (
          <input
            autoFocus
            value={props.findQuery}
            onChange={(e) => props.onFindChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") props.onFindSubmit();
              if (e.key === "Escape") setFindOpen(false);
            }}
            placeholder="Find entity..."
            className="ml-1 w-40 rounded border border-border bg-bg-elevated px-2 py-1 text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        )}
      </div>

      <ToolbarButton title="Remove selected from view" onClick={props.onRemoveSelected}>
        <Trash2 size={15} />
      </ToolbarButton>
      <ToolbarButton title="Align selected (horizontal)" onClick={props.onAlignSelected}>
        <AlignHorizontalJustifyCenter size={15} />
      </ToolbarButton>
      <ToolbarButton title="Flow (show directional arrows)" active={props.flowMode} onClick={props.onToggleFlow}>
        <Workflow size={15} />
      </ToolbarButton>
    </div>
  );
}
