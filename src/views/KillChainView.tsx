import { useState } from "react";
import { ViewHeader } from "../components/shell/ViewHeader";
import { TargetPanel } from "../components/killchain/TargetPanel";
import { AssetPanel } from "../components/killchain/AssetPanel";
import { TacticalMap } from "../components/killchain/TacticalMap";
import { TaskingGantt } from "../components/killchain/TaskingGantt";
import { TaskingDetailPanel } from "../components/killchain/TaskingDetailPanel";

export function KillChainView() {
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  return (
    <div className="flex h-full flex-col">
      <ViewHeader
        title="Kill Chain / Task Planner"
        subtitle="SIMULATOR ONLY — fictional asset/target dataset, never reads live-tracked entities"
        classificationText="SIMULATED // NOTIONAL DATA"
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-80 shrink-0 flex-col overflow-hidden border-r border-border bg-bg-panel">
          <TargetPanel />
          <AssetPanel selectedAssetId={selectedAssetId} onSelectAsset={setSelectedAssetId} />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="relative flex-1">
            <TacticalMap />
          </div>
          <TaskingGantt />
        </div>

        <TaskingDetailPanel selectedAssetId={selectedAssetId} />
      </div>
    </div>
  );
}
