'use client';
import { Handle, Position, NodeProps } from 'reactflow';
import { Film, Play } from 'lucide-react';
import { NodeHeader } from '@/components/ui/NodeHeader';
import { NodeField } from '@/components/ui/NodeField';
import { Button } from '@/components/ui/Button';
import { useWorkflowStore } from '@/store/workflowStore';
import { simulateNodeRun } from '@/lib/utils';
import { cn } from '@/lib/cn';

export function FrameNode({ id, data, selected }: NodeProps) {
  const { updateNodeData, updateNodeStatus, addRun } = useWorkflowStore();
  const isRunning = data.status === 'running';

  async function handleRun() {
    updateNodeStatus(id, 'running');
    try {
      const { output, durationMs } = await simulateNodeRun('frame');
      updateNodeData(id, { output, status: 'success' });
      updateNodeStatus(id, 'success');
      addRun({
        timestamp: new Date(),
        scope: 'single',
        scopeLabel: 'Single Node',
        status: 'success',
        durationMs,
        nodeResults: [{ nodeId: id, nodeName: `Extract Frame (${id})`, status: 'success', durationMs, output }],
      });
    } catch {
      updateNodeStatus(id, 'failed');
    }
  }

  return (
    <div className={cn('flow-node group', isRunning && 'node-running', selected && 'selected')}>
      <NodeHeader
        nodeId={id}
        title="Extract Frame"
        iconBg="rgba(251,191,36,0.1)"
        icon={<Film size={11} color="#fbbf24" />}
        status={data.status}
        onRun={handleRun}
      />
      <div className="px-3 pt-[10px] pb-3">

        {/* video_url handle label */}
        <div className="flex items-center justify-between mb-3 pl-3">
          <span className="text-[10px] text-[#505050]">video input</span>
          <span className="text-[9px] text-[#f87171]">required</span>
        </div>

        <NodeField label="Timestamp" optional>
          <input
            type="text"
            className="node-input"
            placeholder='e.g. 5 or "50%"'
            value={data.timestamp ?? '50%'}
            disabled={data.timestamp_connected}
            onChange={(e) => updateNodeData(id, { timestamp: e.target.value })}
          />
        </NodeField>

        {/* timestamp from-node handle label */}
        <div className="flex items-center pl-3 mt-1 mb-2">
          <span className="text-[9px] text-[#404040]">timestamp (from node) · optional</span>
        </div>

        {data.output && (
          <p className="text-[10px] text-[#505050] mb-2 truncate" style={{ fontFamily: 'var(--mono)' }}>
            ↳ {data.output}
          </p>
        )}

        <Button
          variant="node"
          loading={isRunning}
          icon={!isRunning ? <Play size={10} /> : undefined}
          onClick={handleRun}
        >
          {isRunning ? 'Extracting…' : 'Extract Frame'}
        </Button>

        <div className="flex justify-end mt-3 pr-2">
          <span className="text-[10px] text-[#505050]">frame image</span>
        </div>
      </div>

      {/* Left input handles */}
      <Handle type="target" position={Position.Left} id="video_url"
        style={{ top: 72, background: '#fbbf24', borderColor: '#f59e0b' }}
        title="Input: Video URL (video)" />
      <Handle type="target" position={Position.Left} id="timestamp"
        style={{ top: 155, background: '#222', borderColor: 'rgba(255,255,255,0.2)' }}
        title="Input: Timestamp from node" />

      {/* Right output handle */}
      <Handle type="source" position={Position.Right} id="output"
        style={{ top: '50%', background: '#4ade80', borderColor: '#22c55e' }}
        title="Output: Extracted Frame Image URL" />
    </div>
  );
}
