'use client';
import { Handle, Position, NodeProps } from 'reactflow';
import { MessageSquare, Play } from 'lucide-react';
import { NodeHeader } from '@/components/ui/NodeHeader';
import { NodeField } from '@/components/ui/NodeField';
import { Button } from '@/components/ui/Button';
import { useWorkflowStore } from '@/store/workflowStore';
import { triggerTask, pollTaskResult } from '@/lib/triggerClient';
import { resolveNodeInputs } from '@/lib/resolveNodeInputs';
import { cn } from '@/lib/cn';

const MODELS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash-Lite' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
];

const INPUT_HANDLES = [
  { id: 'system_prompt', label: 'system prompt', tag: 'optional', tagColor: '#505050' },
  { id: 'user_message', label: 'user message', tag: 'required', tagColor: '#f87171' },
  { id: 'images', label: 'images', tag: 'optional - multi', tagColor: '#505050' },
];

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

export function LLMNode({ id, data, selected }: NodeProps) {
  const { updateNodeData, updateNodeStatus, addRun } = useWorkflowStore();
  const isRunning = data.status === 'running';

  async function handleRun() {
    const startTime = Date.now();

    updateNodeStatus(id, 'running');
    updateNodeData(id, { output: null, error: null });

    try {
      const { nodes, edges } = useWorkflowStore.getState();
      const inputs = resolveNodeInputs(id, nodes, edges);

      const systemPrompt =
        (inputs.system_prompt as string) ?? (data.systemPrompt as string) ?? '';
      const userMessage =
        (inputs.user_message as string) ?? (data.userMessage as string) ?? '';
      const images = normalizeImageInputs(inputs.images);

      if (!userMessage.trim()) {
        throw new Error('No user message connected');
      }

      const { runId } = await triggerTask('run-llm', {
        model: (data.model as string) ?? 'gemini-2.5-flash',
        systemPrompt,
        userMessage,
        images,
      });

      const result = await pollTaskResult(runId, (status) => {
        updateNodeStatus(id, status);
      });

      const output = result.output as string;
      const durationMs = Date.now() - startTime;

      updateNodeData(id, { output, status: 'success' });

      addRun({
        timestamp: new Date(),
        scope: 'single',
        scopeLabel: 'Single Node',
        status: 'success',
        durationMs,
        nodeResults: [
          {
            nodeId: id,
            nodeName: `LLM Node (${id})`,
            status: 'success',
            durationMs,
            output,
          },
        ],
      });
    } catch (error) {
      updateNodeStatus(id, 'failed');
      updateNodeData(id, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return (
    <div
      className={cn('flow-node group', isRunning && 'node-running', selected && 'selected')}
      style={{ position: 'relative' }}
    >
      <NodeHeader
        nodeId={id}
        title="Run Any LLM"
        iconBg="rgba(155,109,255,0.15)"
        icon={<MessageSquare size={11} color="#9b6dff" />}
        status={data.status}
        onRun={handleRun}
      />

      <div className="px-3 pt-[10px] pb-3">
        <NodeField label="Model">
          <select
            className="node-select"
            value={(data.model as string) ?? 'gemini-2.5-flash'}
            onChange={(e) => updateNodeData(id, { model: e.target.value })}
          >
            {MODELS.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
        </NodeField>

        <div className="mt-2 space-y-2">
          {INPUT_HANDLES.map((handle) => (
            <div key={handle.id} className="flex items-center justify-between pl-3">
              <span className="text-[10px] text-[#505050]">{handle.label}</span>
              <span className="text-[9px]" style={{ color: handle.tagColor }}>
                {handle.tag}
              </span>
            </div>
          ))}
        </div>

        {data.output && (
          <div
            className="mt-3 bg-[#1a1a1a] border border-[rgba(255,255,255,0.07)] rounded-[6px] p-2 text-[11px] text-[#a0a0a0] leading-[1.6] max-h-[110px] overflow-y-auto"
            style={{ fontFamily: 'var(--mono)' }}
          >
            {data.output as string}
          </div>
        )}

        {data.error && (
          <p className="mt-3 text-[10px] text-[#f87171] leading-[1.5]">
            {data.error as string}
          </p>
        )}

        <Button
          variant="node"
          loading={isRunning}
          icon={!isRunning ? <Play size={10} /> : undefined}
          className="mt-3"
          onClick={handleRun}
        >
          {isRunning ? 'Running...' : 'Run Node'}
        </Button>

        <div className="flex justify-end mt-3 pr-2">
          <span className="text-[10px] text-[#505050]">output (text)</span>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="system_prompt"
        style={{ top: 108, background: '#222', borderColor: 'rgba(255,255,255,0.2)' }}
        title="Input: System Prompt (Text)"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="user_message"
        style={{ top: 132, background: '#222', borderColor: 'rgba(255,255,255,0.2)' }}
        title="Input: User Message (Text)"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="images"
        style={{ top: 156, background: '#222', borderColor: 'rgba(255,255,255,0.2)' }}
        title="Input: Images (Image)"
      />

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ top: '50%', background: '#9b6dff', borderColor: '#7c4dff' }}
        title="Output: LLM Response"
      />
    </div>
  );
}
