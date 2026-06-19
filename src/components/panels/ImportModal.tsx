import { useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { X, UploadCloud } from "lucide-react";
import { useObjectStore } from "../../store/useObjectStore";
import { ENTITY_TYPES, type EntityType, type GraphEntity } from "../../types/ontology";

type TargetField = "ignore" | "name" | "lat" | "lng" | "status" | "affiliation" | "description";

const TARGET_FIELDS: { value: TargetField; label: string }[] = [
  { value: "ignore", label: "Ignore" },
  { value: "name", label: "Name" },
  { value: "lat", label: "Latitude" },
  { value: "lng", label: "Longitude" },
  { value: "status", label: "Status" },
  { value: "affiliation", label: "Affiliation" },
  { value: "description", label: "Description" },
];

function parseFile(file: File): Promise<{ columns: string[]; rows: Record<string, string>[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const text = String(reader.result ?? "");
      if (file.name.toLowerCase().endsWith(".json")) {
        try {
          const parsed = JSON.parse(text);
          const list: unknown[] = Array.isArray(parsed)
            ? parsed
            : Object.values(parsed).find((v) => Array.isArray(v)) ?? [parsed];
          const rows = list.map((row) =>
            Object.fromEntries(
              Object.entries(row as Record<string, unknown>).map(([k, v]) => [k, String(v)]),
            ),
          );
          const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
          resolve({ columns, rows });
        } catch (err) {
          reject(err);
        }
      } else {
        const result = Papa.parse<Record<string, string>>(text, {
          header: true,
          skipEmptyLines: true,
        });
        const columns = result.meta.fields ?? [];
        resolve({ columns, rows: result.data });
      }
    };
    reader.readAsText(file);
  });
}

export function ImportModal({ onClose }: { onClose: () => void }) {
  const addEntities = useObjectStore((s) => s.addEntities);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, TargetField>>({});
  const [entityType, setEntityType] = useState<EntityType>("Person");
  const [category, setCategory] = useState("Imported");
  const [ingestedCount, setIngestedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setIngestedCount(null);
    try {
      const { columns: cols, rows: parsedRows } = await parseFile(file);
      setFileName(file.name);
      setColumns(cols);
      setRows(parsedRows);
      const guessed: Record<string, TargetField> = {};
      for (const col of cols) {
        const lower = col.toLowerCase();
        if (lower.includes("name")) guessed[col] = "name";
        else if (lower === "lat" || lower.includes("latitude")) guessed[col] = "lat";
        else if (lower === "lng" || lower === "lon" || lower.includes("longitude")) guessed[col] = "lng";
        else if (lower.includes("status")) guessed[col] = "status";
        else if (lower.includes("affiliation")) guessed[col] = "affiliation";
        else if (lower.includes("description")) guessed[col] = "description";
        else guessed[col] = "ignore";
      }
      setMapping(guessed);
    } catch {
      setError("Could not parse file. Expecting a CSV with a header row or a JSON array of objects.");
    }
  };

  const nameColumn = useMemo(
    () => Object.entries(mapping).find(([, target]) => target === "name")?.[0],
    [mapping],
  );

  const canIngest = rows.length > 0 && !!nameColumn;

  const ingest = () => {
    if (!nameColumn) return;
    const now = new Date().toISOString();
    const newEntities: GraphEntity[] = rows.map((row, i) => {
      const get = (target: TargetField) =>
        Object.entries(mapping).find(([, t]) => t === target)?.[0];
      const latCol = get("lat");
      const lngCol = get("lng");
      const statusCol = get("status");
      const affiliationCol = get("affiliation");
      const descriptionCol = get("description");
      const lat = latCol ? parseFloat(row[latCol]) : undefined;
      const lng = lngCol ? parseFloat(row[lngCol]) : undefined;
      const statusRaw = statusCol ? row[statusCol]?.toLowerCase() : undefined;
      const status =
        statusRaw === "active" || statusRaw === "standby" || statusRaw === "lost_contact"
          ? statusRaw
          : "unknown";

      return {
        id: `import-${Date.now()}-${i}`,
        type: entityType,
        category,
        name: row[nameColumn] || `Imported record ${i + 1}`,
        lat: Number.isFinite(lat) ? lat : undefined,
        lng: Number.isFinite(lng) ? lng : undefined,
        status,
        affiliation: affiliationCol ? row[affiliationCol] : "IMPORTED RECORD",
        classification: "UNCLASSIFIED // SAMPLE DATA",
        source: "sample",
        clearanceLevel: 1,
        description: descriptionCol ? row[descriptionCol] : "Imported via Gotham Sim ingestion UI.",
        lastUpdate: now,
      };
    });
    addEntities(newEntities);
    setIngestedCount(newEntities.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded border border-border bg-bg-panel">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold text-text-primary">Import Entities</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-text-muted hover:bg-bg-elevated hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded border border-dashed border-border py-6 text-sm text-text-secondary hover:border-accent-cyan/40 hover:text-accent-cyan"
          >
            <UploadCloud size={16} />
            {fileName ? `Loaded ${fileName} (${rows.length} rows)` : "Choose a CSV or JSON file"}
          </button>

          {error && <p className="mt-3 text-xs text-danger">{error}</p>}

          {rows.length > 0 && (
            <>
              <div className="mt-4 flex flex-wrap items-end gap-4">
                <div>
                  <div className="label-section mb-1">Target entity type</div>
                  <select
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value as EntityType)}
                    className="rounded border border-border bg-bg-elevated px-2 py-1.5 text-xs text-text-primary"
                  >
                    {ENTITY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="label-section mb-1">Category label</div>
                  <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="rounded border border-border bg-bg-elevated px-2 py-1.5 text-xs text-text-primary"
                  />
                </div>
              </div>

              <div className="label-section mb-2 mt-4">Column mapping</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {columns.map((col) => (
                  <div key={col} className="flex flex-col gap-1 rounded border border-border bg-bg-elevated p-2">
                    <span className="truncate text-[11px] text-text-secondary">{col}</span>
                    <select
                      value={mapping[col] ?? "ignore"}
                      onChange={(e) =>
                        setMapping((m) => ({ ...m, [col]: e.target.value as TargetField }))
                      }
                      className="rounded border border-border bg-bg-panel px-1.5 py-1 text-[11px] text-text-primary"
                    >
                      {TARGET_FIELDS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {!nameColumn && (
                <p className="mt-2 text-xs text-warning">
                  Map at least one column to "Name" to enable ingestion.
                </p>
              )}

              <div className="label-section mb-2 mt-4">Preview (first 5 rows)</div>
              <div className="overflow-x-auto rounded border border-border">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-border bg-bg-elevated text-left">
                      {columns.map((col) => (
                        <th key={col} className="px-2 py-1 font-medium text-text-secondary">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-border/60">
                        {columns.map((col) => (
                          <td key={col} className="px-2 py-1 text-text-secondary">
                            {row[col]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {ingestedCount !== null && (
            <p className="mt-4 text-xs text-success">
              Ingested {ingestedCount} entities into the shared object model.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-elevated"
          >
            Close
          </button>
          <button
            type="button"
            disabled={!canIngest}
            onClick={ingest}
            className="rounded bg-accent-teal/15 px-3 py-1.5 text-xs font-semibold text-accent-teal ring-1 ring-accent-teal/40 transition-colors hover:bg-accent-teal/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Ingest {rows.length > 0 ? rows.length : ""} records
          </button>
        </div>
      </div>
    </div>
  );
}
