import { useMemo, useState } from "react";
import { Search, Plane, Ship, Truck } from "lucide-react";
import {
  SIMULATOR_ASSETS,
  computeMatchScore,
  matchBadgeFor,
  type AssetBranch,
  type SimulatorAsset,
} from "../../data/simulatorAssets";
import { useNowTick, secondsAgo } from "../../hooks/usePolling";

const TOP_TABS = ["Assets", "Package Template"] as const;
type TopTab = (typeof TOP_TABS)[number];

const FILTER_TABS: { key: "mine" | AssetBranch; label: string }[] = [
  { key: "mine", label: "My Assets" },
  { key: "Air", label: "Air" },
  { key: "Surface", label: "Surface" },
  { key: "Land", label: "Land" },
];

const BRANCH_ICON: Record<AssetBranch, typeof Plane> = {
  Air: Plane,
  Surface: Ship,
  Land: Truck,
};

function MatchBadge({ score }: { score: number }) {
  const badge = matchBadgeFor(score);
  if (!badge) return null;
  return (
    <span
      className={[
        "rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
        badge === "TOP MATCH" ? "bg-accent-teal/15 text-accent-teal" : "bg-warning/15 text-warning",
      ].join(" ")}
    >
      {badge}
    </span>
  );
}

function AssetCard({
  asset,
  selected,
  onClick,
}: {
  asset: SimulatorAsset;
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = BRANCH_ICON[asset.branch];
  const score = computeMatchScore(asset);
  const now = useNowTick();
  const [liveSince] = useState(() => Date.now() - Math.random() * 60_000);

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full flex-col gap-2 rounded border px-2.5 py-2.5 text-left transition-colors",
        selected ? "border-accent-cyan/50 bg-accent-cyan/5" : "border-border bg-bg-elevated hover:border-accent-cyan/30",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon size={13} className="text-text-muted" />
          <span className="text-xs font-semibold text-text-primary">{asset.callsign}</span>
        </div>
        <MatchBadge score={score} />
      </div>

      <div className="flex flex-wrap gap-1">
        {asset.payloads.map((p) => (
          <span key={p.label} className="font-mono-data rounded bg-bg-panel px-1.5 py-0.5 text-[9.5px] text-text-secondary">
            {p.label} ({p.count}x)
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
        <div>
          <div className="text-text-muted">Time on Station</div>
          <div className="font-mono-data text-text-primary">{asset.timeOnStationHr}h</div>
        </div>
        <div>
          <div className="text-text-muted">Munitions</div>
          <div className="font-mono-data text-text-primary truncate">{asset.munitions}</div>
        </div>
        <div>
          <div className="text-text-muted">Time to Target</div>
          <div className="font-mono-data text-text-primary">{asset.timeToTargetMin}min</div>
        </div>
        <div>
          <div className="text-text-muted">Distance</div>
          <div className="font-mono-data text-text-primary">{asset.distanceNm}nm</div>
        </div>
        <div>
          <div className="text-text-muted">Remaining Fuel</div>
          <div className="font-mono-data text-text-primary">{asset.fuelRemainingPct}%</div>
        </div>
        <div>
          <div className="text-text-muted">ATO Mission</div>
          <div className="font-mono-data text-text-primary truncate">{asset.atoMission}</div>
        </div>
        <div className="col-span-2">
          <div className="text-text-muted">Assets Available</div>
          <div className="font-mono-data text-text-primary">{asset.assetsAvailable}</div>
        </div>
      </div>

      <div>
        <div className="label-section mb-1">Mission &amp; Tasks</div>
        <div className="flex flex-col gap-0.5">
          {asset.missionTasks.map((t, i) => (
            <div key={i} className="text-[10.5px] text-text-secondary">
              &bull; {t}
            </div>
          ))}
        </div>
      </div>

      <div className="text-[9px] uppercase tracking-wide text-success">
        LIVE (updated {secondsAgo(liveSince, now)})
      </div>
    </button>
  );
}

export function AssetPanel({
  selectedAssetId,
  onSelectAsset,
}: {
  selectedAssetId: string | null;
  onSelectAsset: (id: string) => void;
}) {
  const [topTab, setTopTab] = useState<TopTab>("Assets");
  const [filter, setFilter] = useState<"mine" | AssetBranch>("mine");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return SIMULATOR_ASSETS.filter((a) => {
      if (filter === "mine" && !a.isMine) return false;
      if (filter !== "mine" && a.branch !== filter) return false;
      if (query && !a.callsign.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    }).sort((a, b) => computeMatchScore(b) - computeMatchScore(a));
  }, [filter, query]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex border-b border-border">
        {TOP_TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTopTab(t)}
            className={[
              "flex-1 px-2 py-2 text-[10.5px] font-medium transition-colors",
              topTab === t
                ? "border-b-2 border-accent-cyan text-accent-cyan"
                : "border-b-2 border-transparent text-text-secondary hover:text-text-primary",
            ].join(" ")}
          >
            {t}
          </button>
        ))}
      </div>

      {topTab === "Assets" ? (
        <>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="font-mono-data text-[10px] text-text-muted">
              {SIMULATOR_ASSETS.length} ASSETS ANALYZED
            </span>
          </div>

          <div className="px-3 pb-2">
            <div className="flex items-center gap-2 rounded border border-border bg-bg-elevated px-2 py-1.5">
              <Search size={12} className="text-text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search assets..."
                className="w-full bg-transparent text-[11px] text-text-primary placeholder:text-text-muted focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-1 px-3 pb-2">
            {FILTER_TABS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={[
                  "rounded px-2 py-1 text-[10px] font-medium transition-colors",
                  filter === f.key
                    ? "bg-accent-cyan/15 text-accent-cyan ring-1 ring-accent-cyan/40"
                    : "text-text-secondary hover:bg-bg-elevated",
                ].join(" ")}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 pb-3">
            {filtered.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                selected={asset.id === selectedAssetId}
                onClick={() => onSelectAsset(asset.id)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="py-6 text-center text-[10px] uppercase tracking-wide text-text-muted">
                No assets match this filter
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center p-4 text-center text-[11px] text-text-muted">
          Package templates let you save a tasking bundle (assets + munitions
          + ATO mission) for reuse against future notional targets.
        </div>
      )}
    </div>
  );
}
