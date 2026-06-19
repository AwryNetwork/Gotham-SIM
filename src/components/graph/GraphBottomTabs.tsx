import { useState } from "react";
import type { GraphEntity } from "../../types/ontology";

const TABS = ["Preview", "History", "Code", "Build timeline", "Data health"] as const;
type Tab = (typeof TABS)[number];

interface GraphBottomTabsProps {
  visibleCount: number;
  totalCount: number;
  edgeCount: number;
  selected: GraphEntity[];
  activityLog: string[];
  entities: GraphEntity[];
}

export function GraphBottomTabs({
  visibleCount,
  totalCount,
  edgeCount,
  selected,
  activityLog,
  entities,
}: GraphBottomTabsProps) {
  const [tab, setTab] = useState<Tab>("Preview");

  const lostContact = entities.filter((e) => e.status === "lost_contact").length;
  const withGeo = entities.filter((e) => e.lat !== undefined).length;

  return (
    <div className="flex h-36 shrink-0 flex-col border-t border-border bg-bg-panel">
      <div className="flex border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={[
              "px-3 py-1.5 text-[11px] font-medium transition-colors",
              tab === t
                ? "border-b-2 border-accent-cyan text-accent-cyan"
                : "border-b-2 border-transparent text-text-secondary hover:text-text-primary",
            ].join(" ")}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 text-xs">
        {tab === "Preview" && (
          <div className="flex flex-col gap-1 text-text-secondary">
            <div>
              Showing <span className="font-mono-data text-text-primary">{visibleCount}</span> of{" "}
              <span className="font-mono-data text-text-primary">{totalCount}</span> nodes,{" "}
              <span className="font-mono-data text-text-primary">{edgeCount}</span> edges visible.
            </div>
            {selected.length === 0 && <div className="text-text-muted">No node selected.</div>}
            {selected.length > 0 && (
              <div className="mt-1 flex flex-col gap-0.5">
                {selected.slice(0, 6).map((e) => (
                  <div key={e.id}>
                    <span className="text-text-primary">{e.name}</span> — {e.category} / {e.type}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "History" && (
          <div className="flex flex-col gap-1 text-text-secondary">
            {activityLog.length === 0 && <div className="text-text-muted">No actions yet this session.</div>}
            {activityLog
              .slice()
              .reverse()
              .map((entry, i) => (
                <div key={i} className="font-mono-data text-[11px]">
                  {entry}
                </div>
              ))}
          </div>
        )}

        {tab === "Code" && (
          <pre className="whitespace-pre-wrap font-mono-data text-[11px] text-text-secondary">
{`// Illustrative only — Gotham Sim does not execute live queries.
FROM integration.objects
JOIN gcss_a, fms, dtms, atrrs, tapdb, medpros
  ON member-of, tasked-by, located-at
WHERE classification = 'NOTIONAL'
SELECT *`}
          </pre>
        )}

        {tab === "Build timeline" && (
          <div className="flex flex-col gap-1 text-text-secondary">
            <div>GCSS-A feed synced — 2026-06-18 00:00 UTC</div>
            <div>FMS feed synced — 2026-06-18 00:00 UTC</div>
            <div>DTMS feed synced — 2026-06-18 00:00 UTC</div>
            <div>ATRRS feed synced — 2026-06-18 00:00 UTC</div>
            <div>TAPDB feed synced — 2026-06-18 00:00 UTC</div>
            <div>MEDPROS feed synced — 2026-06-18 00:00 UTC</div>
            <div>Integration fusion pass completed — 2026-06-18 04:00 UTC</div>
          </div>
        )}

        {tab === "Data health" && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded border border-border p-2">
              <div className="label-section">Total objects</div>
              <div className="font-mono-data text-sm text-text-primary">{totalCount}</div>
            </div>
            <div className="rounded border border-border p-2">
              <div className="label-section">Geolocated</div>
              <div className="font-mono-data text-sm text-text-primary">{withGeo}</div>
            </div>
            <div className="rounded border border-border p-2">
              <div className="label-section">Lost contact</div>
              <div className="font-mono-data text-sm text-danger">{lostContact}</div>
            </div>
            <div className="rounded border border-border p-2">
              <div className="label-section">Total links</div>
              <div className="font-mono-data text-sm text-text-primary">{edgeCount}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
