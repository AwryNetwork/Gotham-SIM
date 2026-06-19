import { useEffect, useMemo, useRef } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useTimelineStore } from "../../store/useTimelineStore";
import { useUIStore } from "../../store/useUIStore";
import { useVisibleEntities } from "../../store/useObjectStore";

const STEP_MS = 30 * 60 * 1000;
const PLAY_TICK_MS = 15 * 60 * 1000;

function formatTick(ms: number) {
  const d = new Date(ms);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

export function TimelinePanel() {
  const { timelineOpen, toggleTimeline } = useUIStore();
  const {
    rangeStart,
    rangeEnd,
    currentTime,
    playing,
    togglePlay,
    setCurrentTime,
    step,
  } = useTimelineStore();
  const entities = useVisibleEntities();
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => step(PLAY_TICK_MS), 400);
    return () => clearInterval(interval);
  }, [playing, step]);

  const ticks = useMemo(() => {
    const count = 9;
    return Array.from({ length: count }, (_, i) => {
      const time = rangeStart + ((rangeEnd - rangeStart) * i) / (count - 1);
      return { time, pct: (i / (count - 1)) * 100 };
    });
  }, [rangeStart, rangeEnd]);

  const progressPct =
    ((currentTime - rangeStart) / (rangeEnd - rangeStart)) * 100;

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = Math.min(
      1,
      Math.max(0, (e.clientX - rect.left) / rect.width),
    );
    setCurrentTime(rangeStart + ratio * (rangeEnd - rangeStart));
  };

  const legend = useMemo(
    () => [
      {
        label: "Satellite",
        color: "var(--accent-cyan)",
        count: entities.filter((e) => e.type === "Satellite").length,
      },
      {
        label: "Vessel",
        color: "var(--accent-teal)",
        count: entities.filter((e) => e.type === "Vessel").length,
      },
      {
        label: "Aircraft",
        color: "var(--accent-blue)",
        count: entities.filter((e) => e.type === "Aircraft").length,
      },
      {
        label: "Event",
        color: "var(--warning)",
        count: entities.filter((e) => e.type === "Event").length,
      },
    ],
    [entities],
  );

  return (
    <div className="flex shrink-0 flex-col border-t border-border bg-bg-panel">
      <button
        type="button"
        onClick={toggleTimeline}
        className="flex h-5 w-full items-center justify-center gap-1 text-text-muted hover:bg-bg-elevated hover:text-text-secondary"
      >
        <span className="label-section">Timeline</span>
        {timelineOpen ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
      </button>

      {timelineOpen && (
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => step(-STEP_MS)}
              className="flex h-7 w-7 items-center justify-center rounded text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
            >
              <SkipBack size={14} />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-7 w-7 items-center justify-center rounded bg-accent-cyan/10 text-accent-cyan ring-1 ring-accent-cyan/40 hover:bg-accent-cyan/20"
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              type="button"
              onClick={() => step(STEP_MS)}
              className="flex h-7 w-7 items-center justify-center rounded text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
            >
              <SkipForward size={14} />
            </button>
          </div>

          <div className="font-mono-data w-[150px] shrink-0 text-xs text-accent-cyan">
            {formatTick(currentTime)} UTC
          </div>

          <div className="relative flex-1 py-3">
            <div
              ref={trackRef}
              onClick={handleTrackClick}
              className="relative h-1.5 cursor-pointer rounded-full bg-bg-elevated"
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-accent-cyan/50"
                style={{ width: `${progressPct}%` }}
              />
              <div
                className="absolute top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-accent-cyan bg-bg-panel shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                style={{ left: `${progressPct}%` }}
              />
              {ticks.map((t) => (
                <div
                  key={t.time}
                  className="absolute top-full mt-1.5 flex -translate-x-1/2 flex-col items-center"
                  style={{ left: `${t.pct}%` }}
                >
                  <div className="h-1.5 w-px bg-border" />
                  <span className="font-mono-data mt-0.5 whitespace-nowrap text-[9px] text-text-muted">
                    {formatTick(t.time)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-4 border-l border-border pl-4">
            {legend.map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: l.color }}
                />
                <span className="text-[10px] text-text-secondary">
                  {l.label}
                </span>
                <span className="font-mono-data text-[10px] text-text-muted">
                  {l.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
