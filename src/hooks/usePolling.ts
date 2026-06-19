import { useEffect, useRef, useState } from "react";

export interface PollingResult<T> {
  data: T | null;
  error: string | null;
  lastUpdatedAt: number | null;
  loading: boolean;
}

/** Generic poll-on-interval hook used by every REST live-feed hook. */
export function usePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs: number,
  enabled: boolean,
): PollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function tick() {
      setLoading(true);
      try {
        const result = await fetcherRef.current();
        if (!cancelled) {
          setData(result);
          setError(null);
          setLastUpdatedAt(Date.now());
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Request failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
      if (!cancelled) timer = setTimeout(tick, intervalMs);
    }
    tick();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, intervalMs]);

  return { data, error, lastUpdatedAt, loading };
}

/** Ticks once a second so "updated Ns ago" labels stay live without polling. */
export function useNowTick(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function secondsAgo(timestamp: number | null, now: number): string {
  if (timestamp === null) return "—";
  const s = Math.max(0, Math.round((now - timestamp) / 1000));
  return `${s}s ago`;
}
