import { useMemo } from "react";
import { ReactFlow, Background, Controls, Handle, Position, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ViewHeader } from "../components/shell/ViewHeader";
import { useVisibleEntities, useSimulatorAssets } from "../store/useObjectStore";
import { PROPOSED_TASKING } from "../data/simulatorAssets";

interface StageData {
  label: string;
  detail: string;
  count: number;
  first?: boolean;
  last?: boolean;
  [key: string]: unknown;
}

function StageNode({ data }: { data: StageData }) {
  return (
    <div className="w-44 rounded border border-accent-cyan/40 bg-bg-panel px-3 py-2.5 shadow-[0_0_12px_rgba(34,211,238,0.08)]">
      {!data.first && <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-accent-cyan !bg-bg-panel" />}
      <div className="label-section text-accent-cyan">{data.label}</div>
      <div className="mt-1 font-mono-data text-lg text-text-primary">{data.count}</div>
      <div className="mt-0.5 text-[10px] text-text-muted">{data.detail}</div>
      {!data.last && <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-accent-cyan !bg-bg-panel" />}
    </div>
  );
}

const NODE_TYPES = { stage: StageNode };

export function WorkflowView() {
  const visible = useVisibleEntities();
  const simulatorAssets = useSimulatorAssets();

  const counts = useMemo(() => {
    const total = visible.length;
    const geolocated = visible.filter((e) => e.lat !== undefined);
    const identified = new Set(visible.map((e) => e.category)).size;
    const active = geolocated.filter((e) => e.status === "active").length;
    const lostContact = visible.filter((e) => e.status === "lost_contact").length;
    return {
      detect: total,
      identify: identified,
      track: active,
      plan: simulatorAssets.length,
      task: PROPOSED_TASKING.length,
      assess: lostContact,
    };
  }, [visible, simulatorAssets]);

  const nodes: Node[] = useMemo(
    () => [
      { id: "detect", type: "stage", position: { x: 0, y: 80 }, data: { label: "Detect", detail: "Live + sample entities", count: counts.detect, first: true } },
      { id: "identify", type: "stage", position: { x: 260, y: 80 }, data: { label: "Identify", detail: "Distinct categories", count: counts.identify } },
      { id: "track", type: "stage", position: { x: 520, y: 80 }, data: { label: "Track", detail: "Active + geolocated", count: counts.track } },
      { id: "plan", type: "stage", position: { x: 780, y: 80 }, data: { label: "Plan", detail: "Simulator assets (Kill Chain)", count: counts.plan } },
      { id: "task", type: "stage", position: { x: 1040, y: 80 }, data: { label: "Task", detail: "Proposed tasking entries", count: counts.task } },
      { id: "assess", type: "stage", position: { x: 1300, y: 80 }, data: { label: "Assess", detail: "Lost-contact tracks", count: counts.assess, last: true } },
    ],
    [counts],
  );

  const edges: Edge[] = useMemo(
    () => [
      { id: "e1", source: "detect", target: "identify", animated: true, style: { stroke: "#22d3ee" } },
      { id: "e2", source: "identify", target: "track", animated: true, style: { stroke: "#22d3ee" } },
      { id: "e3", source: "track", target: "plan", animated: true, style: { stroke: "#22d3ee" } },
      { id: "e4", source: "plan", target: "task", animated: true, style: { stroke: "#2dd4bf" } },
      { id: "e5", source: "task", target: "assess", animated: true, style: { stroke: "#2dd4bf" } },
    ],
    [],
  );

  return (
    <div className="flex h-full flex-col">
      <ViewHeader
        title="Workflow Editor"
        subtitle="Detect -> Identify -> Track -> Plan -> Task -> Assess, reading the shared object model live"
      />
      <div className="flex-1 bg-bg-base">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          fitView
          proOptions={{ hideAttribution: true }}
          nodesDraggable
          nodesConnectable={false}
          colorMode="dark"
        >
          <Background color="#1e2835" gap={24} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}
