import { Smartphone } from "lucide-react";

// Demo-only public model from Google's model-viewer sample assets — not
// tied to any tracked entity's real geometry. <model-viewer ar> uses Scene
// Viewer (Android) / Quick Look (iOS) under the hood, so this works without
// touching the raw WebXR API directly.
const DEMO_MODEL_GLB = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";

export function ArDrop() {
  return (
    <div className="flex flex-col gap-2 rounded border border-border bg-bg-panel p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-warning">
        <Smartphone size={13} /> AR Demo — Optional
      </div>
      <p className="text-[10.5px] leading-snug text-text-muted">
        Drops a placeholder 3D marker into your camera view via your phone's
        AR Quick Look / Scene Viewer. This is a UI demo only — the model is
        not tied to any tracked entity's real-world geometry.
      </p>
      <model-viewer
        src={DEMO_MODEL_GLB}
        ios-src=""
        alt="Notional AR marker"
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate
        shadow-intensity="1"
        style={{ width: "100%", height: "220px", backgroundColor: "#0e141d", borderRadius: "4px" }}
      />
    </div>
  );
}
