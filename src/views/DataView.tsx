import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { useObjectStore, useVisibleEntities } from "../store/useObjectStore";
import { useAuthStore } from "../store/useAuthStore";
import {
  ENTITY_COLOR,
  ENTITY_LABEL,
  STATUS_COLOR,
  STATUS_LABEL,
} from "../lib/entityVisuals";
import { ViewHeader } from "../components/shell/ViewHeader";
import { ImportModal } from "../components/panels/ImportModal";

const SOURCE_BADGE_COLOR: Record<string, string> = {
  live: "text-accent-cyan border-accent-cyan/40 bg-accent-cyan/10",
  sample: "text-text-muted border-border bg-bg-elevated",
};

export function DataView() {
  const entities = useVisibleEntities();
  const setSelection = useObjectStore((s) => s.setSelection);
  const role = useAuthStore((s) => s.user?.role);
  const canImport = role === "Admin" || role === "Analyst";
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <ViewHeader
        title="Entity Data"
        subtitle={`${entities.length} records in the shared object model (live + sample)`}
      />
      <div className="flex items-center justify-end border-b border-border px-4 py-2">
        <button
          type="button"
          disabled={!canImport}
          title={canImport ? undefined : "Viewer role cannot import data"}
          onClick={() => setImportOpen(true)}
          className="flex items-center gap-1.5 rounded bg-accent-teal/15 px-3 py-1.5 text-xs font-semibold text-accent-teal ring-1 ring-accent-teal/40 hover:bg-accent-teal/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <UploadCloud size={13} /> Import Data
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-border text-left">
              {["Source", "Name", "Type", "Category", "Affiliation", "Lat", "Lng", "Status", "Last Update"].map(
                (h) => (
                  <th
                    key={h}
                    className="label-section px-3 py-2 font-semibold"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {entities.map((e) => (
              <tr
                key={e.id}
                onClick={() => setSelection([e.id])}
                className="cursor-pointer border-b border-border/60 hover:bg-bg-panel"
              >
                <td className="px-3 py-2">
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${SOURCE_BADGE_COLOR[e.source]}`}
                  >
                    {e.source}
                  </span>
                </td>
                <td className="px-3 py-2 font-medium text-text-primary">
                  {e.name}
                </td>
                <td className="px-3 py-2">
                  <span
                    className="inline-flex items-center gap-1.5"
                    style={{ color: ENTITY_COLOR[e.type] }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: ENTITY_COLOR[e.type] }}
                    />
                    {ENTITY_LABEL[e.type]}
                  </span>
                </td>
                <td className="px-3 py-2 text-text-secondary">{e.category}</td>
                <td className="px-3 py-2 text-text-secondary">
                  {e.affiliation}
                </td>
                <td className="font-mono-data px-3 py-2 text-text-secondary">
                  {e.lat !== undefined ? e.lat.toFixed(2) : "—"}
                </td>
                <td className="font-mono-data px-3 py-2 text-text-secondary">
                  {e.lng !== undefined ? e.lng.toFixed(2) : "—"}
                </td>
                <td className="px-3 py-2">
                  <span
                    className="inline-flex items-center gap-1.5"
                    style={{ color: STATUS_COLOR[e.status] }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLOR[e.status] }}
                    />
                    {STATUS_LABEL[e.status]}
                  </span>
                </td>
                <td className="font-mono-data px-3 py-2 text-text-muted">
                  {new Date(e.lastUpdate).toISOString().slice(0, 16).replace("T", " ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {importOpen && <ImportModal onClose={() => setImportOpen(false)} />}
    </div>
  );
}
