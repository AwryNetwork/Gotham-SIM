import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/shell/AppShell";
import { MapView } from "./views/MapView";
import { NetworkGraphView } from "./views/NetworkGraphView";
import { KillChainView } from "./views/KillChainView";
import { DataView } from "./views/DataView";
import { SearchView } from "./views/SearchView";
import { HistoryView } from "./views/HistoryView";
import { SettingsView } from "./views/SettingsView";
import { WorkflowView } from "./views/WorkflowView";
import { SensorTaskingView } from "./views/SensorTaskingView";
import { FieldView } from "./views/FieldView";
import { LoginView } from "./views/LoginView";
import { useAuthStore } from "./store/useAuthStore";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const token = useAuthStore((s) => s.token);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    if (status === "idle") hydrate();
  }, [status, hydrate]);

  if (status === "idle" || status === "checking") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-bg-base text-xs text-text-muted">
        Connecting to Gotham Sim backend…
      </div>
    );
  }

  if (!token) return <LoginView />;
  return <>{children}</>;
}

function App() {
  return (
    <RequireAuth>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/map" replace />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/network" element={<NetworkGraphView />} />
          <Route path="/killchain" element={<KillChainView />} />
          <Route path="/workflow" element={<WorkflowView />} />
          <Route path="/sensor-tasking" element={<SensorTaskingView />} />
          <Route path="/data" element={<DataView />} />
          <Route path="/search" element={<SearchView />} />
          <Route path="/history" element={<HistoryView />} />
          <Route path="/field" element={<FieldView />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/map" replace />} />
        </Route>
      </Routes>
    </RequireAuth>
  );
}

export default App;
