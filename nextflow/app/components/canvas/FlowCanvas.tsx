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
} from 'reactflow';
import type { Edge, Node } from 'reactflow';
import { useWorkflowStore } from '@/store/workflowStore';
import { buildNode, showToast, formatDuration } from '@/lib/utils';
import { NodeType } from '@/types';
import { TextNode, ImageNode, VideoNode, LLMNode, CropNode, FrameNode } from '@/components/nodes';
import { AnimatedEdge } from '@/components/canvas/AnimatedEdge';
import { resolveNodeInputs } from '@/lib/resolveNodeInputs';
import { pollTaskResult, triggerTask } from '@/lib/triggerClient';

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

type RunResult = {
  nodeId: string;
  nodeName: string;
  status: 'success' | 'failed';
  durationMs: number;
  output?: string;
  error?: string;
};

function normalizeImageInputs(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string' && Boolean(item))
      .flatMap((item) => item.split(','))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function cloneNodes(nodes: Node[]): Node[] {
  return nodes.map((node) => ({
    ...node,
    position: { ...node.position },
    data: { ...(node.data as Record<string, unknown>) },
    style: node.style ? { ...node.style } : undefined,
  }));
}

function updateExecutionNode(
  nodes: Node[],
  result: RunResult,
) {
  const node = nodes.find((item) => item.id === result.nodeId);
  if (!node) return;

  node.data = {
    ...(node.data as Record<string, unknown>),
    status: result.status,
    ...(result.output ? { output: result.output, outputUrl: result.output } : {}),
    ...(result.error ? { error: result.error } : { error: null }),
  };
}

function FlowCanvasInner({ onRunningChange }: FlowCanvasProps) {
  const reactFlow = useReactFlow();
  const {
    nodes, edges,
    onNodesChange, onEdgesChange, onConnect,
    addNode, deleteNode,
    updateNodeStatus, updateNodeData, addRun,
  } = useWorkflowStore();

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
    [reactFlow, addNode],
  );

  const executeNode = useCallback(async (
    node: Node,
    currentNodes: Node[],
    currentEdges: Edge[],
  ): Promise<RunResult> => {
    const startedAt = Date.now();
    const data = (node.data ?? {}) as Record<string, unknown>;
    const inputs = resolveNodeInputs(node.id, currentNodes, currentEdges);
    const nodeName = `${node.type} (${node.id})`;

    try {
      if (node.type === 'text') {
        const output = String(data.content ?? data.output ?? '').trim();
        if (!output) throw new Error('Text node is empty');

        updateNodeData(node.id, { output, status: 'success', error: null });
        updateNodeStatus(node.id, 'success');
        return { nodeId: node.id, nodeName, status: 'success', durationMs: Date.now() - startedAt, output };
      }

      if (node.type === 'image') {
        const output = String(data.outputUrl ?? data.previewUrl ?? data.output ?? '').trim();
        if (!output) throw new Error('No image uploaded');

        updateNodeData(node.id, { output, status: 'success', error: null });
        updateNodeStatus(node.id, 'success');
        return { nodeId: node.id, nodeName, status: 'success', durationMs: Date.now() - startedAt, output };
      }

      if (node.type === 'video') {
        const output = String(data.outputUrl ?? data.previewUrl ?? data.output ?? '').trim();
        if (!output) throw new Error('No video uploaded');

        updateNodeData(node.id, { output, status: 'success', error: null });
        updateNodeStatus(node.id, 'success');
        return { nodeId: node.id, nodeName, status: 'success', durationMs: Date.now() - startedAt, output };
      }

      if (node.type === 'crop') {
        const imageUrl = String(inputs.image ?? data.outputUrl ?? data.previewUrl ?? '').trim();
        if (!imageUrl) throw new Error('No image connected or uploaded');

        const x = Number(inputs.x_percent ?? data.xPercent ?? 0);
        const y = Number(inputs.y_percent ?? data.yPercent ?? 0);
        const width = Number(data.widthPercent ?? 100);
        const height = Number(data.heightPercent ?? 100);

        const { runId } = await triggerTask('crop-image', { imageUrl, x, y, width, height });
        const result = await pollTaskResult(runId, (status) => updateNodeStatus(node.id, status));
        const output = String(result.outputUrl ?? '').trim();

        updateNodeData(node.id, { output, status: 'success', error: null });
        return { nodeId: node.id, nodeName, status: 'success', durationMs: Date.now() - startedAt, output };
      }

      if (node.type === 'frame') {
        const videoUrl = String(inputs.video_url ?? data.outputUrl ?? data.previewUrl ?? '').trim();
        if (!videoUrl) throw new Error('No video connected or uploaded');

        const timestamp = String(inputs.timestamp ?? data.timestamp ?? '50%');
        const { runId } = await triggerTask('extract-frame', { videoUrl, timestamp });
        const result = await pollTaskResult(runId, (status) => updateNodeStatus(node.id, status));
        const output = String(result.outputUrl ?? '').trim();

        updateNodeData(node.id, { output, status: 'success', error: null });
        return { nodeId: node.id, nodeName, status: 'success', durationMs: Date.now() - startedAt, output };
      }

      if (node.type === 'llm') {
        const systemPrompt = String(inputs.system_prompt ?? data.systemPrompt ?? '').trim();
        const userMessage = String(inputs.user_message ?? data.userMessage ?? '').trim();
        const images = normalizeImageInputs(inputs.images);

        if (!userMessage) throw new Error('No user message connected');

        const { runId } = await triggerTask('run-llm', {
          model: String(data.model ?? 'gemini-2.5-flash'),
          systemPrompt,
          userMessage,
          images,
        });
        const result = await pollTaskResult(runId, (status) => updateNodeStatus(node.id, status));
        const output = String(result.output ?? '').trim();

        updateNodeData(node.id, { output, status: 'success', error: null });
        return { nodeId: node.id, nodeName, status: 'success', durationMs: Date.now() - startedAt, output };
      }

      throw new Error(`Unsupported node type: ${node.type}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      updateNodeStatus(node.id, 'failed');
      updateNodeData(node.id, { error: message });
      return {
        nodeId: node.id,
        nodeName,
        status: 'failed',
        durationMs: Date.now() - startedAt,
        error: message,
      };
    }
  }, [updateNodeData, updateNodeStatus]);

  const runAll = useCallback(async () => {
    if (!nodes.length) {
      showToast('Add some nodes first');
      return;
    }

    onRunningChange(true);
    const startTime = Date.now();

    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();
    nodes.forEach((node) => {
      inDegree.set(node.id, 0);
      adjList.set(node.id, []);
    });
    edges.forEach((edge) => {
      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
      adjList.get(edge.source)?.push(edge.target);
    });

    const levels: string[][] = [];
    let queue = nodes.filter((node) => (inDegree.get(node.id) ?? 0) === 0).map((node) => node.id);
    const visited = new Set<string>();

    while (queue.length) {
      levels.push([...queue]);
      const nextQueue: string[] = [];
      queue.forEach((id) => {
        visited.add(id);
        adjList.get(id)?.forEach((childId) => {
          const deg = (inDegree.get(childId) ?? 1) - 1;
          inDegree.set(childId, deg);
          if (deg === 0 && !visited.has(childId)) {
            nextQueue.push(childId);
          }
        });
      });
      queue = nextQueue;
    }

    nodes.forEach((node) => updateNodeStatus(node.id, 'running'));

    const executionNodes = cloneNodes(nodes);
    const allResults: RunResult[] = [];

    for (const level of levels) {
      const levelResults = await Promise.all(
        level.map(async (nodeId) => {
          const node = executionNodes.find((item) => item.id === nodeId);
          if (!node) {
            return {
              nodeId,
              nodeName: nodeId,
              status: 'failed' as const,
              durationMs: 0,
              error: 'Node not found',
            };
          }

          return executeNode(node, executionNodes, edges);
        }),
      );

      levelResults.forEach((result) => updateExecutionNode(executionNodes, result));
      allResults.push(...levelResults);
    }

    const totalMs = Date.now() - startTime;
    const allOk = allResults.every((result) => result.status === 'success');

    addRun({
      timestamp: new Date(),
      scope: 'full',
      scopeLabel: 'Full Workflow',
      status: allOk ? 'success' : 'failed',
      durationMs: totalMs,
      nodeResults: allResults,
    });

    showToast(
      allOk
        ? `Workflow complete in ${formatDuration(totalMs)}`
        : 'Workflow finished with errors',
    );
    onRunningChange(false);
  }, [nodes, edges, updateNodeStatus, addRun, onRunningChange, executeNode]);

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

      {nodes.length === 0 && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center justify-center z-10 w-full"
          style={{ marginTop: '-20px' }}
        >
          <p className="text-[16px] font-[500] mb-2 text-[#a0a0a0]">
            Add a node
          </p>
          <div className="flex items-center gap-1.5 font-[500] text-[16px] text-[#555]">
            Double click, right click, or press
            <span className="bg-[#1a1a1a] text-[#888] px-1.5 py-0.5 rounded-[5px] text-[10px] font-mono border border-white/10 uppercase font-bold leading-none shadow-sm pb-[3px]">
              N
            </span>
          </div>
        </div>
      )}
    </ReactFlow>
  );
}

export function FlowCanvas(props: FlowCanvasProps) {
  return <FlowCanvasInner {...props} />;
}
