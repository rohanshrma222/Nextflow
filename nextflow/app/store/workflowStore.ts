import { create } from 'zustand';
import {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from 'reactflow';
import { WorkflowRun, RunStatus } from '../types';
import { fetchRuns, saveRun } from '@/actions/runs';

interface HistorySnapshot {
  nodes: Node[];
  edges: Edge[];
}

interface WorkflowStore {
  nodes: Node[];
  edges: Edge[];
  workflowName: string;
  runs: WorkflowRun[];
  runCounter: number;
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  sidebarCollapsed: boolean;
  historyPanelOpen: boolean;

  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  updateNodeStatus: (nodeId: string, status: RunStatus) => void;

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  addNode: (node: Node) => void;
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;

  setWorkflowName: (name: string) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  clearCanvas: () => void;

  saveToHistory: () => void;
  undo: () => void;
  redo: () => void;

  loadRuns: () => Promise<void>;
  addRun: (run: Omit<WorkflowRun, 'id'>) => Promise<void>;

  toggleSidebar: () => void;
  toggleHistoryPanel: () => void;
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: [],
  edges: [],
  workflowName: 'Untitled',
  runs: [],
  runCounter: 0,
  past: [],
  future: [],
  sidebarCollapsed: false,
  historyPanelOpen: false,

  updateNodeData: (nodeId, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
    })),

  updateNodeStatus: (nodeId, status) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, status } } : n
      ),
    })),

  onNodesChange: (changes) =>
    set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) })),

  onEdgesChange: (changes) =>
    set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),

  onConnect: (connection) => {
    const { edges } = get();

    const wouldCreateCycle = (srcId: string, tgtId: string): boolean => {
      const visited = new Set<string>();
      const queue = [tgtId];
      while (queue.length) {
        const curr = queue.shift()!;
        if (curr === srcId) return true;
        if (visited.has(curr)) continue;
        visited.add(curr);
        edges.filter((e) => e.source === curr).forEach((e) => queue.push(e.target));
      }
      return false;
    };

    if (connection.source && connection.target) {
      if (wouldCreateCycle(connection.source, connection.target)) return;
    }

    const newEdge: Edge = {
      ...connection,
      id: `e-${Date.now()}`,
      type: 'default',
      animated: true,
      style: {
        stroke: '#9b6dff',
        strokeWidth: 1.5,
        strokeDasharray: '5 3',
      },
    };
    set({ edges: addEdge(newEdge, edges) });
  },

  addNode: (node) => {
    const { past, nodes, edges } = get();
    set({
      past: [...past, { nodes, edges }].slice(-50),
      future: [],
      nodes: [...nodes, node],
    });
  },

  deleteNode: (nodeId) => {
    const { past, nodes, edges } = get();
    set({
      past: [...past, { nodes, edges }].slice(-50),
      future: [],
      nodes: nodes.filter((n) => n.id !== nodeId),
      edges: edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    });
  },

  duplicateNode: (nodeId) => {
    const { nodes } = get();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const newNode: Node = {
      ...node,
      id: `n-${Date.now()}`,
      position: { x: node.position.x + 30, y: node.position.y + 30 },
      data: { ...node.data },
      selected: false,
    };
    get().addNode(newNode);
  },

  setWorkflowName: (name) => set({ workflowName: name }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  clearCanvas: () => {
    const { past, nodes, edges } = get();
    set({ past: [...past, { nodes, edges }].slice(-50), future: [], nodes: [], edges: [] });
  },

  saveToHistory: () => {
    const { past, nodes, edges } = get();
    set({ past: [...past, { nodes, edges }].slice(-50), future: [] });
  },

  undo: () => {
    const { past, nodes, edges, future } = get();
    if (!past.length) return;
    const prev = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      future: [{ nodes, edges }, ...future],
      nodes: prev.nodes,
      edges: prev.edges,
    });
  },

  redo: () => {
    const { past, nodes, edges, future } = get();
    if (!future.length) return;
    const next = future[0];
    set({
      past: [...past, { nodes, edges }],
      future: future.slice(1),
      nodes: next.nodes,
      edges: next.edges,
    });
  },

  loadRuns: async () => {
    try {
      const fetched = await fetchRuns();
      set({ runs: fetched });
    } catch (e) {
      console.error('Failed fetching runs', e);
    }
  },

  addRun: async (run) => {
    // 1. Optimistic UI update
    const tempId = Date.now();
    const newRun = { ...run, id: tempId };
    const { runs } = get();
    set({ runs: [newRun as WorkflowRun, ...runs] });

    // 2. Persist to Postgres via Server Action
    const result = await saveRun(run);
    if (result.success && result.id) {
      set((state) => ({
        runs: state.runs.map(r => r.id === tempId ? { ...r, id: result.id! } : r)
      }));
    }
  },

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleHistoryPanel: () => set((s) => ({ historyPanelOpen: !s.historyPanelOpen })),
}));
