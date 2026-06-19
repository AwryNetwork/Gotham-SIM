import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import type { CameraFeedItem } from "../../hooks/useLiveFeeds";

const SNAPSHOT_REFRESH_MS = 10_000;

function HlsVideo({ url }: { url: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari supports HLS natively.
      video.src = url;
      return;
    }
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      return () => hls.destroy();
    }
  }, [url]);

  return <video ref={videoRef} controls autoPlay muted className="block w-full" />;
}

export function CameraFeedPopup({ camera }: { camera: CameraFeedItem }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), SNAPSHOT_REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  const snapshotSrc = `${camera.url}${camera.url.includes("?") ? "&" : "?"}_=${tick}`;

  return (
    <div className="w-60 font-sans">
      <div className="mb-1.5 text-xs font-semibold text-text-primary">
        {camera.name}
      </div>
      <div className="overflow-hidden rounded border border-border bg-black">
        {camera.kind === "hls" ? (
          <HlsVideo url={camera.url} />
        ) : (
          <img
            src={snapshotSrc}
            alt={camera.name}
            className="block w-full"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        )}
      </div>
      <div className="mt-1.5 text-[9px] leading-snug text-text-muted">
        UNCLASSIFIED // OPEN-SOURCE — public 511/DOT traffic camera feed.
      </div>
    </div>
  );
}
