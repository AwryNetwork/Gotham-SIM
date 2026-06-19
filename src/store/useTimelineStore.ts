import { create } from "zustand";

const RANGE_START = new Date("2026-06-17T00:00:00Z").getTime();
const RANGE_END = new Date("2026-06-19T00:00:00Z").getTime();

interface TimelineState {
  rangeStart: number;
  rangeEnd: number;
  currentTime: number;
  playing: boolean;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setCurrentTime: (time: number) => void;
  step: (deltaMs: number) => void;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  rangeStart: RANGE_START,
  rangeEnd: RANGE_END,
  currentTime: RANGE_START + (RANGE_END - RANGE_START) * 0.62,
  playing: false,
  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),
  togglePlay: () => set({ playing: !get().playing }),
  setCurrentTime: (time) => {
    const { rangeStart, rangeEnd } = get();
    set({ currentTime: Math.min(rangeEnd, Math.max(rangeStart, time)) });
  },
  step: (deltaMs) => {
    const { currentTime, rangeStart, rangeEnd } = get();
    const next = currentTime + deltaMs;
    set({ currentTime: Math.min(rangeEnd, Math.max(rangeStart, next)) });
  },
}));
