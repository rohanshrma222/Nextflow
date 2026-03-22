'use client';
import { Handle, Position, NodeProps } from 'reactflow';
import { MessageSquare, Play } from 'lucide-react';
import { NodeHeader } from '@/components/ui/NodeHeader';
import { NodeField } from '@/components/ui/NodeField';
import { Button } from '@/components/ui/Button';
import { useWorkflowStore } from '@/store/workflowStore';
import { simulateNodeRun } from '@/lib/utils';
import { cn } from '@/lib/cn';

const MODELS = [
  { value: 'gemini-2.0-flash',          label: 'Gemini 2.0 Flash' },
  { value: 'gemini-1.5-pro',            label: 'Gemini 1.5 Pro' },
  { value: 'gemini-1.5-flash',          label: 'Gemini 1.5 Flash' },
  { value: 'gemini-2.0-flash-thinking', label: 'Gemini 2.0 Thinking' },
];

// Fixed vertical positions for the 3 input handles (relative to node top)
const INPUT_HANDLES = [
  { id: 'system_prompt', label: 'system prompt', tag: 'optional',       tagColor: '#505050' },
  { id: 'user_message',  label: 'user message',  tag: 'required',       tagColor: '#f87171' },
  { id: 'images',        label: 'images',         tag: 'optional · multi', tagColor: '#505050' },
];

export function LLMNode({ id, data, selected }: NodeProps) {
  const { updateNodeData, updateNodeStatus, addRun } = useWorkflowStore();
  const isRunning = data.status === 'running';

  async function handleRun() {
    updateNodeStatus(id, 'running');
    updateNodeData(id, { output: null });
    try {
      const { output, durationMs } = await simulateNodeRun('llm');
      updateNodeData(id, { output, status: 'success' });
      updateNodeStatus(id, 'success');
      addRun({
        timestamp: new Date(),
        scope: 'single',
        scopeLabel: 'Single Node',
        status: 'success',
        durationMs,
        nodeResults: [{ nodeId: id, nodeName: `LLM Node (${id})`, status: 'success', durationMs, output }],
      });
    } catch {
      updateNodeStatus(id, 'failed');
    }
  }

  return (
    <div className={cn('flow-node group', isRunning && 'node-running', selected && 'selected')} style={{ position: 'relative' }}>
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
            value={data.model ?? 'gemini-2.0-flash'}
            onChange={(e) => updateNodeData(id, { model: e.target.value })}
          >
            {MODELS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </NodeField>

        {/* Handle labels — left side */}
        <div className="mt-2 space-y-2">
          {INPUT_HANDLES.map((h) => (
            <div key={h.id} className="flex items-center justify-between pl-3">
              <span className="text-[10px] text-[#505050]">{h.label}</span>
              <span className="text-[9px]" style={{ color: h.tagColor }}>{h.tag}</span>
            </div>
          ))}
        </div>

        {/* LLM output display */}
        {data.output && (
          <div
            className="mt-3 bg-[#1a1a1a] border border-[rgba(255,255,255,0.07)] rounded-[6px] p-2 text-[11px] text-[#a0a0a0] leading-[1.6] max-h-[110px] overflow-y-auto"
            style={{ fontFamily: 'var(--mono)' }}
          >
            {data.output}
          </div>
        )}

        <Button
          variant="node"
          loading={isRunning}
          icon={!isRunning ? <Play size={10} /> : undefined}
          className="mt-3"
          onClick={handleRun}
        >
          {isRunning ? 'Running…' : 'Run Node'}
        </Button>

        <div className="flex justify-end mt-3 pr-2">
          <span className="text-[10px] text-[#505050]">output (text)</span>
        </div>
      </div>

      {/* Left handles — system_prompt, user_message, images */}
      <Handle type="target" position={Position.Left} id="system_prompt"
        style={{ top: 108, background: '#222', borderColor: 'rgba(255,255,255,0.2)' }}
        title="Input: System Prompt (Text)" />
      <Handle type="target" position={Position.Left} id="user_message"
        style={{ top: 132, background: '#222', borderColor: 'rgba(255,255,255,0.2)' }}
        title="Input: User Message (Text)" />
      <Handle type="target" position={Position.Left} id="images"
        style={{ top: 156, background: '#222', borderColor: 'rgba(255,255,255,0.2)' }}
        title="Input: Images (Image)" />

      {/* Right output handle */}
      <Handle type="source" position={Position.Right} id="output"
        style={{ top: '50%', background: '#9b6dff', borderColor: '#7c4dff' }}
        title="Output: LLM Response" />
    </div>
  );
}
