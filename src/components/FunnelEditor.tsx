import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge as addRFEdge,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react';
import { useStore } from '../store/useStore';
import { computeStageVolumes } from '../lib/projections';
import { totalEntryVolume } from '../types';
import StageNode from './StageNode';
import ConversionEdge from './ConversionEdge';

const nodeTypes = { stage: StageNode };
const edgeTypes = { conversion: ConversionEdge };

export default function FunnelEditor() {
  const stages = useStore((s) => s.stages);
  const stageEdges = useStore((s) => s.edges);
  const cohorts = useStore((s) => s.cohorts);
  const selectedCohortId = useStore((s) => s.selectedCohortId);
  const addStage = useStore((s) => s.addStage);
  const addEdge = useStore((s) => s.addEdge);
  const updateStage = useStore((s) => s.updateStage);

  // Compute volumes per cohort per stage
  const stageVolumes = useMemo(() => {
    const result: Record<string, Record<string, { volume: number; pctOfEntry: number }>> = {};
    const displayCohorts = selectedCohortId
      ? cohorts.filter((c) => c.id === selectedCohortId)
      : cohorts;

    for (const cohort of displayCohorts) {
      const volumes = computeStageVolumes(stages, stageEdges, cohort);
      const entry = totalEntryVolume(cohort);
      for (const [stageId, vol] of volumes) {
        if (!result[stageId]) result[stageId] = {};
        result[stageId][cohort.id] = {
          volume: vol,
          pctOfEntry: entry > 0 ? vol / entry : 0,
        };
      }
    }
    return result;
  }, [stages, stageEdges, cohorts, selectedCohortId]);

  // Convert store stages to React Flow nodes
  const initialNodes: Node[] = useMemo(
    () =>
      stages.map((s, i) => ({
        id: s.id,
        type: 'stage',
        position: (s as unknown as Record<string, unknown>).position
          ? ((s as unknown as Record<string, unknown>).position as { x: number; y: number })
          : { x: 250 + (i % 3) * 220, y: Math.floor(i / 3) * 160 + 50 },
        data: {
          label: s.name,
          isTerminal: s.isTerminal,
          stageId: s.id,
          volumes: stageVolumes[s.id] ?? {},
        },
      })),
    [stages, stageVolumes],
  );

  // Convert store edges to React Flow edges
  const initialEdges: Edge[] = useMemo(
    () =>
      stageEdges.map((e) => ({
        id: e.id,
        source: e.sourceId,
        target: e.targetId,
        type: 'conversion',
        data: { edgeId: e.id },
      })),
    [stageEdges],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync React Flow nodes back when store changes
  useMemo(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useMemo(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      const newEdge = addEdge(params.source, params.target);
      if (newEdge) {
        setEdges((eds) =>
          addRFEdge(
            {
              ...params,
              id: newEdge.id,
              type: 'conversion',
              data: { edgeId: newEdge.id },
            },
            eds,
          ),
        );
      }
    },
    [addEdge, setEdges],
  );

  const onNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      updateStage(node.id, { position: node.position } as never);
    },
    [updateStage],
  );

  const handleAddStage = () => {
    const name = prompt('Stage name:');
    if (name?.trim()) addStage(name.trim());
  };

  return (
    <div className="h-full w-full relative">
      <div className="absolute top-3 left-3 z-10">
        <button
          onClick={handleAddStage}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-colors"
        >
          + Add Stage
        </button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        deleteKeyCode={null}
        className="bg-slate-50"
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
