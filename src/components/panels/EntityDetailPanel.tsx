import { X } from "lucide-react";
import { useObjectStore, useSelectedEntities } from "../../store/useObjectStore";
import {
  ENTITY_COLOR,
  ENTITY_LABEL,
  STATUS_COLOR,
  STATUS_LABEL,
} from "../../lib/entityVisuals";
import { ClassificationBanner } from "../shell/ClassificationBanner";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label-section mb-0.5">{label}</div>
      <div className="font-mono-data text-xs text-text-primary">{value}</div>
    </div>
  );
}

export function EntityDetailPanel() {
  const selected = useSelectedEntities();
  const clearSelection = useObjectStore((s) => s.clearSelection);

  if (selected.length === 0) return null;

  if (selected.length > 1) {
    return (
      <div className="absolute right-4 top-14 z-10 flex w-64 flex-col rounded border border-border bg-bg-panel/95 backdrop-blur">
        <ClassificationBanner variant="minimal" />
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <span className="text-sm font-semibold text-text-primary">
            {selected.length} entities selected
          </span>
          <button
            type="button"
            onClick={clearSelection}
            className="rounded p-1 text-text-muted hover:bg-bg-elevated hover:text-text-primary"
          >
            <X size={14} />
          </button>
        </div>
        <div className="flex max-h-72 flex-col gap-1 overflow-y-auto p-2">
          {selected.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between rounded px-2 py-1 text-xs"
            >
              <span className="truncate text-text-secondary">{e.name}</span>
              <span
                className="ml-2 shrink-0 text-[10px] font-semibold uppercase"
                style={{ color: ENTITY_COLOR[e.type] }}
              >
                {ENTITY_LABEL[e.type]}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const entity = selected[0];

  return (
    <div className="absolute right-4 top-14 z-10 flex w-72 flex-col rounded border border-border bg-bg-panel/95 backdrop-blur">
      <ClassificationBanner variant="minimal" />
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <div>
          <div
            className="text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: ENTITY_COLOR[entity.type] }}
          >
            {ENTITY_LABEL[entity.type]} &middot; {entity.category}
          </div>
          <div className="text-sm font-semibold text-text-primary">
            {entity.name}
          </div>
        </div>
        <button
          type="button"
          onClick={clearSelection}
          className="rounded p-1 text-text-muted hover:bg-bg-elevated hover:text-text-primary"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex flex-col gap-3 p-3">
        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: STATUS_COLOR[entity.status] }}
          />
          <span
            className="text-xs font-medium"
            style={{ color: STATUS_COLOR[entity.status] }}
          >
            {STATUS_LABEL[entity.status]}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {entity.lat !== undefined && (
            <Field label="Latitude" value={entity.lat.toFixed(4)} />
          )}
          {entity.lng !== undefined && (
            <Field label="Longitude" value={entity.lng.toFixed(4)} />
          )}
          {entity.altitudeKm !== undefined && (
            <Field label="Altitude" value={`${entity.altitudeKm.toFixed(1)} km`} />
          )}
          {entity.headingDeg !== undefined && (
            <Field label="Heading" value={`${entity.headingDeg}°`} />
          )}
          {entity.speedKn !== undefined && (
            <Field label="Speed" value={`${entity.speedKn} kn`} />
          )}
          <Field
            label="Last Update"
            value={new Date(entity.lastUpdate)
              .toISOString()
              .slice(0, 16)
              .replace("T", " ")}
          />
        </div>

        <Field label="Affiliation" value={entity.affiliation} />

        <div>
          <div className="label-section mb-0.5">Description</div>
          <p className="text-xs leading-snug text-text-secondary">
            {entity.description}
          </p>
        </div>

        <div className="flex items-center justify-between rounded border border-class-green/40 bg-class-green/5 px-2 py-1 text-[9px] font-semibold tracking-wide text-class-green">
          <span>{entity.classification}</span>
          <span className="rounded bg-bg-elevated px-1.5 py-0.5 text-text-muted">
            {entity.source.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
