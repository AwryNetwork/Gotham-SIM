import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import maplibregl, { type Marker } from "maplibre-gl";
import { Camera } from "lucide-react";
import { useUIStore } from "../../store/useUIStore";
import { useLiveRawStore } from "../../store/useLiveRawStore";
import { useMap } from "./MapContext";
import { CameraFeedPopup } from "./CameraFeedPopup";

interface MountedMarker {
  marker: Marker;
  iconRoot: Root;
  popupRoot: Root;
}

function teardown(mounted: MountedMarker[]) {
  mounted.forEach(({ marker }) => marker.remove());
  // Defer root.unmount() — calling it synchronously inside an effect cleanup
  // that fires as part of an ancestor's unmount (e.g. navigating away from
  // the map) races with React's own commit and logs a warning.
  setTimeout(() => {
    mounted.forEach(({ iconRoot, popupRoot }) => {
      iconRoot.unmount();
      popupRoot.unmount();
    });
  }, 0);
}

export function CameraLayer() {
  const map = useMap();
  const camerasVisible = useUIStore((s) => s.camerasVisible);
  const cameras = useLiveRawStore((s) => s.cameras);
  const mountedRef = useRef<MountedMarker[]>([]);

  useEffect(() => {
    if (!map || !camerasVisible) {
      teardown(mountedRef.current);
      mountedRef.current = [];
      return;
    }

    mountedRef.current = cameras.map((camera) => {
      const el = document.createElement("div");
      el.style.width = "22px";
      el.style.height = "22px";
      el.style.borderRadius = "4px";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.background = "rgba(245, 158, 11, 0.18)";
      el.style.border = "1px solid #f59e0b";
      el.style.cursor = "pointer";
      const iconRoot = createRoot(el);
      iconRoot.render(<Camera size={13} color="#f59e0b" strokeWidth={2} />);

      const popupContainer = document.createElement("div");
      const popupRoot = createRoot(popupContainer);
      popupRoot.render(<CameraFeedPopup camera={camera} />);

      const popup = new maplibregl.Popup({
        offset: 14,
        closeButton: true,
        maxWidth: "260px",
      }).setDOMContent(popupContainer);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([camera.lng, camera.lat])
        .setPopup(popup)
        .addTo(map);

      return { marker, iconRoot, popupRoot };
    });

    return () => {
      teardown(mountedRef.current);
      mountedRef.current = [];
    };
  }, [map, camerasVisible, cameras]);

  return null;
}
