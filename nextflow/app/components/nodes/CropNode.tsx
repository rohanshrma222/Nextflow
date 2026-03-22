'use client';
import { Handle, Position, NodeProps } from 'reactflow';
import { Crop, Play } from 'lucide-react';
import { NodeHeader } from '@/components/ui/NodeHeader';
import { Button } from '@/components/ui/Button';
import { useWorkflowStore } from '@/store/workflowStore';
import { simulateNodeRun } from '@/lib/utils';
import { cn } from '@/lib/cn';

export function CropNode({ id, data, selected }: NodeProps) {
  const { updateNodeData, updateNodeStatus, addRun } = useWorkflowStore();
  const isRunning = data.status === 'running';

  async function handleRun() {
    updateNodeStatus(id, 'running');
    try {
      const { output, durationMs } = await simulateNodeRun('crop');
      updateNodeData(id, { output, status: 'success' });
      updateNodeStatus(id, 'success');
      addRun({
        timestamp: new Date(),
        scope: 'single',
        scopeLabel: 'Single Node',
        status: 'success',
        durationMs,
        nodeResults: [{ nodeId: id, nodeName: `Crop Image (${id})`, status: 'success', durationMs, output }],
      });
    } catch {
      updateNodeStatus(id, 'failed');
    }
  }

  return (
    <div className={cn('flow-node group', isRunning && 'node-running', selected && 'selected')}>
      <NodeHeader
        nodeId={id}
        title="Crop Image"
        iconBg="rgba(248,113,113,0.12)"
        icon={<Crop size={11} color="#f87171" />}
        status={data.status}
        onRun={handleRun}
      />
      <div className="px-3 pt-[10px] pb-3">

        {/* image_url handle label */}
        <div className="flex items-center justify-between mb-2 pl-3">
          <span className="text-[10px] text-[#505050]">image input</span>
          <span className="text-[9px] text-[#f87171]">required</span>
        </div>

        {/* Crop parameter grid */}
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          {[
            { key: 'cropX', label: 'X %',  default: '0'   },
            { key: 'cropY', label: 'Y %',  default: '0'   },
            { key: 'cropW', label: 'W %',  default: '100' },
            { key: 'cropH', label: 'H %',  default: '100' },
          ].map(({ key, label, default: def }) => (
            <div key={key}>
              <label className="block text-[9px] text-[#505050] uppercase tracking-[0.5px] mb-1">{label}</label>
              <input
                type="number"
                className="node-input"
                min={0} max={100}
                value={data[key] ?? def}
                disabled={data[`${key}_connected`]}
                onChange={(e) => updateNodeData(id, { [key]: e.target.value })}
              />
            </div>
          ))}
        </div>

        {/* Optional handles labels */}
        <div className="space-y-1 mb-2">
          <div className="flex items-center pl-3">
            <span className="text-[9px] text-[#404040]">x (from node) · optional</span>
          </div>
          <div className="flex items-center pl-3">
            <span className="text-[9px] text-[#404040]">y (from node) · optional</span>
          </div>
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
          {isRunning ? 'Processing…' : 'Run Crop'}
        </Button>

        <div className="flex justify-end mt-3 pr-2">
          <span className="text-[10px] text-[#505050]">cropped image</span>
        </div>
      </div>

      {/* Left input handles */}
      <Handle type="target" position={Position.Left} id="image_url"
        style={{ top: 72, background: '#4ade80', borderColor: '#22c55e' }}
        title="Input: Image URL (image)" />
      <Handle type="target" position={Position.Left} id="x_percent"
        style={{ top: 194, background: '#222', borderColor: 'rgba(255,255,255,0.2)' }}
        title="Input: X percent (text/number)" />
      <Handle type="target" position={Position.Left} id="y_percent"
        style={{ top: 212, background: '#222', borderColor: 'rgba(255,255,255,0.2)' }}
        title="Input: Y percent (text/number)" />

      {/* Right output handle */}
      <Handle type="source" position={Position.Right} id="output"
        style={{ top: '50%', background: '#4ade80', borderColor: '#22c55e' }}
        title="Output: Cropped Image URL" />
    </div>
  );
}
