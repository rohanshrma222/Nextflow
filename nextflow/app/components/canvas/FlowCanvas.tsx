'use client';
import { useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  NodeTypes,
  EdgeTypes,
  useReactFlow,
  Panel,
} from 'reactflow';
import { Trash2 } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import { buildNode, showToast, simulateNodeRun, formatDuration } from '@/lib/utils';
import { NodeType } from '@/types';
import { TextNode, ImageNode, VideoNode, LLMNode, CropNode, FrameNode } from '@/components/nodes';
import { AnimatedEdge } from '@/components/canvas/AnimatedEdge';

const nodeTypes: NodeTypes = {
  text: TextNode,
  image: ImageNode,
  video: VideoNode,
  llm: LLMNode,
  crop: CropNode,
  frame: FrameNode,
};

const edgeTypes: EdgeTypes = {
  default: AnimatedEdge,
};

interface FlowCanvasProps {
  onRunningChange: (running: boolean) => void;
}

function FlowCanvasInner({ onRunningChange }: FlowCanvasProps) {
  const reactFlow = useReactFlow();
  const {
    nodes, edges,
    onNodesChange, onEdgesChange, onConnect,
    addNode, deleteNode, clearCanvas,
    updateNodeStatus, updateNodeData, addRun,
  } = useWorkflowStore();

  // ── Keyboard shortcuts ──
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if ((e.target as HTMLElement).isContentEditable) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selected = nodes.filter((n) => n.selected);
        selected.forEach((n) => deleteNode(n.id));
        if (selected.length) showToast(`${selected.length} node(s) deleted`);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [nodes, deleteNode]);

  // ── Drag-drop from sidebar ──
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/nextflow-node') as NodeType;
      if (!type) return;

      const bounds = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const position = reactFlow.screenToFlowPosition({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });

      const node = buildNode(type, position);
      addNode(node);
      showToast(`${type} node added`);
    },
    [reactFlow, addNode]
  );

  // ── Topological parallel run ──
  const runAll = useCallback(async () => {
    if (!nodes.length) { showToast('⚠ Add some nodes first'); return; }
    onRunningChange(true);

    const startTime = Date.now();

    // Build in-degree map and adjacency list for topological sort
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();
    nodes.forEach((n) => { inDegree.set(n.id, 0); adjList.set(n.id, []); });
    edges.forEach((e) => {
      inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
      adjList.get(e.source)?.push(e.target);
    });

    // Group into levels for parallel execution
    const levels: string[][] = [];
    let queue = nodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0).map((n) => n.id);
    const visited = new Set<string>();

    while (queue.length) {
      levels.push([...queue]);
      const nextQueue: string[] = [];
      queue.forEach((id) => {
        visited.add(id);
        adjList.get(id)?.forEach((childId) => {
          const deg = (inDegree.get(childId) ?? 1) - 1;
          inDegree.set(childId, deg);
          if (deg === 0 && !visited.has(childId)) nextQueue.push(childId);
        });
      });
      queue = nextQueue;
    }

    // Mark all as running first
    nodes.forEach((n) => updateNodeStatus(n.id, 'running'));

    type RunResult = { nodeId: string; nodeName: string; status: 'success' | 'failed'; durationMs: number; output?: string; error?: string };
    const allResults: RunResult[] = [];

    // Execute level by level — nodes within a level run in parallel
    for (const level of levels) {
      const levelResults = await Promise.all(
        level.map(async (nodeId): Promise<RunResult> => {
          const node = nodes.find((n) => n.id === nodeId);
          if (!node) return { nodeId, nodeName: nodeId, status: 'failed', durationMs: 0 };
          try {
            const { output, durationMs } = await simulateNodeRun(node.type);
            updateNodeData(nodeId, { output, status: 'success' });
            updateNodeStatus(nodeId, 'success');
            return { nodeId, nodeName: `${node.type} (${nodeId})`, status: 'success', durationMs, output };
          } catch (err) {
            updateNodeStatus(nodeId, 'failed');
            return { nodeId, nodeName: `${node.type} (${nodeId})`, status: 'failed', durationMs: 0, error: String(err) };
          }
        })
      );
      allResults.push(...levelResults);
    }

    const totalMs = Date.now() - startTime;
    const allOk = allResults.every((r) => r.status === 'success');

    addRun({
      timestamp: new Date(),
      scope: 'full',
      scopeLabel: 'Full Workflow',
      status: allOk ? 'success' : 'failed',
      durationMs: totalMs,
      nodeResults: allResults,
    });

    showToast(allOk
      ? `✅ Workflow complete in ${formatDuration(totalMs)}`
      : '⚠ Workflow finished with errors');
    onRunningChange(false);
  }, [nodes, edges, updateNodeStatus, updateNodeData, addRun, onRunningChange]);

  // Expose run function to parent via window (avoids prop drilling through ReactFlowProvider)
  useEffect(() => {
    (window as Window & { __nfRunAll?: () => void }).__nfRunAll = runAll;
  }, [runAll]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDragOver={onDragOver}
      onDrop={onDrop}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={{ padding: 0.15, maxZoom: 0.82 }}
      minZoom={0.1}
      maxZoom={3}
      deleteKeyCode={null}
      style={{ background: 'transparent' }}
      proOptions={{ hideAttribution: true }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={24}
        size={1.5}
        color="rgba(255,255,255,0.06)"
      />

      <MiniMap
        position="bottom-right"
        nodeColor={() => '#333'}
        maskColor="rgba(10,10,10,0.85)"
        style={{
          background: '#0a0a0a',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          width: 140,
          height: 100,
        }}
      />

      {/* Empty state overlay */}
      {nodes.length === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center justify-center z-10 w-full" style={{ marginTop: '-20px' }}>
          <p className="text-[16px] font-[500] mb-2 text-[#a0a0a0]">
            Add a node
          </p>
          <div className="flex items-center gap-1.5 font-[500] text-[16px] text-[#555]">
            Double click, right click, or press
            <span className="bg-[#1a1a1a] text-[#888] px-1.5 py-0.5 rounded-[5px] text-[10px] font-mono border border-white/10 uppercase font-bold leading-none shadow-sm pb-[3px]">N</span>
          </div>
        </div>
      )}
    </ReactFlow>
  );
}

export function FlowCanvas(props: FlowCanvasProps) {
  return <FlowCanvasInner {...props} />;
}
