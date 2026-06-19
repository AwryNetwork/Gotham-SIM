import { PROPOSED_TASKING } from "../../data/simulatorAssets";

const HOURS = Array.from({ length: 16 }, (_, i) => i);
const SPAN = HOURS.length;

const TASK_COLOR = "#22d3ee";

export function TaskingGantt() {
  return (
    <div className="flex h-32 shrink-0 flex-col border-t border-border bg-bg-panel">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="label-section">Proposed Tasking</span>
        <span className="font-mono-data text-[10px] text-text-muted">UTC hourly axis</span>
      </div>

      <div className="flex-1 overflow-x-auto px-3 py-2">
        <div className="relative min-w-[640px]">
          <div className="flex border-b border-border/60 pb-1">
            {HOURS.map((h) => (
              <div key={h} className="flex-1 text-center font-mono-data text-[9px] text-text-muted">
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5 pt-1.5">
            {PROPOSED_TASKING.map((task) => (
              <div key={task.id} className="relative flex h-5 items-center">
                <div className="absolute inset-0 flex items-center pl-1 text-[9.5px] text-text-muted">
                  {task.assetCallsign}
                </div>
                <div
                  className="absolute h-3.5 rounded-sm"
                  style={{
                    left: `${(task.startHourUtc / SPAN) * 100}%`,
                    width: `${(task.durationHr / SPAN) * 100}%`,
                    backgroundColor: `${TASK_COLOR}33`,
                    border: `1px solid ${TASK_COLOR}`,
                  }}
                  title={`${task.taskType} — ${task.assetCallsign}`}
                >
                  <span className="absolute left-1 top-1/2 -translate-y-1/2 truncate text-[8.5px] text-accent-cyan">
                    {task.taskType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
