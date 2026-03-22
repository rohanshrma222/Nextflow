export type NodeType = 'text' | 'image' | 'video' | 'llm' | 'crop' | 'frame';

export type HandleType = 'text' | 'image' | 'video' | 'any';

export type RunStatus = 'idle' | 'running' | 'success' | 'failed';

export interface NodeRunResult {
  nodeId: string;
  nodeName: string;
  status: RunStatus;
  durationMs: number;
  output?: string;
  error?: string;
}

export interface WorkflowRun {
  id: number;
  timestamp: Date;
  scope: 'full' | 'partial' | 'single';
  scopeLabel: string;
  status: RunStatus;
  durationMs: number;
  nodeResults: NodeRunResult[];
}

export interface WorkflowData {
  name: string;
  nodes: import('reactflow').Node[];
  edges: import('reactflow').Edge[];
  meta: {
    exportedAt: string;
    version: string;
  };
}

export interface NodeDefinition {
  type: NodeType;
  label: string;
  badge: string;
  iconColorClass: string;
  description: string;
}

export const NODE_DEFINITIONS: NodeDefinition[] = [
  { type: 'text',  label: 'Text Node',     badge: 'txt', iconColorClass: 'icon-text',  description: 'Simple text input with output handle' },
  { type: 'image', label: 'Upload Image',   badge: 'img', iconColorClass: 'icon-image', description: 'Upload image via Transloadit' },
  { type: 'video', label: 'Upload Video',   badge: 'vid', iconColorClass: 'icon-video', description: 'Upload video via Transloadit' },
  { type: 'llm',   label: 'Run Any LLM',   badge: 'llm', iconColorClass: 'icon-llm',   description: 'Execute Gemini via Trigger.dev' },
  { type: 'crop',  label: 'Crop Image',    badge: 'ffm', iconColorClass: 'icon-crop',  description: 'FFmpeg crop via Trigger.dev' },
  { type: 'frame', label: 'Extract Frame', badge: 'ffm', iconColorClass: 'icon-frame', description: 'Extract video frame via FFmpeg' },
];

export const EDGE_TYPE_COLORS: Record<HandleType | string, string> = {
  text:  '#60a5fa',
  image: '#4ade80',
  video: '#fbbf24',
  any:   '#9b6dff',
};
