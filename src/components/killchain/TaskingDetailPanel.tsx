import { useState } from "react";
import { Send } from "lucide-react";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../store/useAuthStore";
import { SIMULATOR_ASSETS } from "../../data/simulatorAssets";

const TASK_TYPES = ["Strike Window", "ISR Track", "Standby Strike", "Fire Mission", "CAS Alert", "BDA Pass"];

export function TaskingDetailPanel({ selectedAssetId }: { selectedAssetId: string | null }) {
  const role = useAuthStore((s) => s.user?.role);
  const canTask = role === "Admin" || role === "Analyst";

  const asset = SIMULATOR_ASSETS.find((a) => a.id === selectedAssetId) ?? null;

  const [classificationNote, setClassificationNote] = useState("SIMULATED // NOTIONAL DATA");
  const [taskType, setTaskType] = useState(TASK_TYPES[0]);
  const [timeOnTarget, setTimeOnTarget] = useState("");
  const [guidance, setGuidance] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  const submit = async () => {
    setStatus("submitting");
    try {
      await apiFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          type: "killchain-simulated",
          payload: {
            assetCallsign: asset?.callsign ?? "UNASSIGNED",
            taskType,
            timeOnTarget,
            guidance,
            classificationNote,
          },
        }),
      });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="flex w-72 shrink-0 flex-col overflow-y-auto border-l border-border bg-bg-panel">
      <div className="border-b border-border px-3 py-2.5">
        <span className="label-section">Proposed Tasking</span>
      </div>

      <div className="flex flex-col gap-3 p-3">
        {asset ? (
          <div className="rounded border border-accent-cyan/30 bg-accent-cyan/5 px-2.5 py-2 text-xs text-text-secondary">
            Selected asset: <span className="font-mono-data text-accent-cyan">{asset.callsign}</span>
          </div>
        ) : (
          <div className="rounded border border-border bg-bg-elevated px-2.5 py-2 text-[11px] text-text-muted">
            Select an asset from the left panel to propose tasking.
          </div>
        )}

        <div>
          <div className="label-section mb-1">Classification Note</div>
          <input
            value={classificationNote}
            onChange={(e) => setClassificationNote(e.target.value)}
            className="w-full rounded border border-border bg-bg-elevated px-2.5 py-1.5 text-xs text-text-primary focus:border-accent-cyan/50 focus:outline-none"
          />
        </div>

        <div>
          <div className="label-section mb-1">Task Type</div>
          <select
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
            className="w-full rounded border border-border bg-bg-elevated px-2.5 py-1.5 text-xs text-text-primary"
          >
            {TASK_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="label-section mb-1">Time on Target (UTC)</div>
          <input
            value={timeOnTarget}
            onChange={(e) => setTimeOnTarget(e.target.value)}
            placeholder="e.g. 2026-06-18T07:30:00Z"
            className="font-mono-data w-full rounded border border-border bg-bg-elevated px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-accent-cyan/50 focus:outline-none"
          />
        </div>

        <div>
          <div className="label-section mb-1">Guidance</div>
          <textarea
            value={guidance}
            onChange={(e) => setGuidance(e.target.value)}
            rows={5}
            placeholder="Notional tasking guidance / remarks..."
            className="w-full resize-none rounded border border-border bg-bg-elevated px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-accent-cyan/50 focus:outline-none"
          />
        </div>

        <button
          type="button"
          disabled={!canTask || !asset || status === "submitting"}
          onClick={submit}
          title={canTask ? undefined : "Viewer role cannot submit tasking"}
          className="mt-1 flex items-center justify-center gap-1.5 rounded bg-accent-teal/15 py-2 text-xs font-semibold text-accent-teal ring-1 ring-accent-teal/40 transition-colors hover:bg-accent-teal/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send size={13} />
          {status === "submitting" ? "Submitting…" : "Submit Proposed Tasking"}
        </button>

        {status === "done" && (
          <p className="text-[11px] text-success">
            Mock tasking entry recorded. No real targeting or weaponeering occurred.
          </p>
        )}
        {status === "error" && <p className="text-[11px] text-danger">Failed to record tasking entry.</p>}
      </div>
    </div>
  );
}
