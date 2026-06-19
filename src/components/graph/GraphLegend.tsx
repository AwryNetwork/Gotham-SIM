import { Boxes, LayoutGrid } from "lucide-react";

export interface LegendRow {
  category: string;
  color: string;
  count: number;
  visibleCount: number;
}

interface GraphLegendProps {
  rows: LegendRow[];
  groupByColor: boolean;
  onToggleGroupByColor: () => void;
  onLayoutByColor: () => void;
  onColorChange: (category: string, color: string) => void;
}

export function GraphLegend({
  rows,
  groupByColor,
  onToggleGroupByColor,
  onLayoutByColor,
  onColorChange,
}: GraphLegendProps) {
  return (
    <div className="flex w-60 shrink-0 flex-col border-l border-border bg-bg-panel">
      <div className="border-b border-border px-3 py-2.5">
        <span className="label-section">Legend</span>
      </div>

      <div className="flex flex-col gap-1 border-b border-border p-2">
        <button
          type="button"
          onClick={onToggleGroupByColor}
          className={[
            "flex items-center gap-1.5 rounded px-2 py-1.5 text-[11px] font-medium transition-colors",
            groupByColor
              ? "bg-accent-cyan/15 text-accent-cyan"
              : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary",
          ].join(" ")}
        >
          <Boxes size={13} /> Group by color
        </button>
        <button
          type="button"
          onClick={onLayoutByColor}
          className="flex items-center gap-1.5 rounded px-2 py-1.5 text-[11px] font-medium text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
        >
          <LayoutGrid size={13} /> Layout by color
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {rows.map((row) => (
          <div
            key={row.category}
            className="flex items-center justify-between gap-2 rounded px-1.5 py-1.5 hover:bg-bg-elevated"
          >
            <div className="flex items-center gap-2">
              <span className="relative inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: row.color }}>
                <input
                  type="color"
                  value={row.color}
                  title="Custom color"
                  onChange={(e) => onColorChange(row.category, e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </span>
              <span className="text-xs text-text-secondary">{row.category}</span>
            </div>
            <span className="font-mono-data text-[10px] text-text-muted">
              {row.visibleCount}/{row.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
