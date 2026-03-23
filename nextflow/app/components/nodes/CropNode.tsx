'use client';
import { Handle, Position, NodeProps } from 'reactflow';
import { Crop, Play } from 'lucide-react';
import { NodeHeader } from '@/components/ui/NodeHeader';
import { Button } from '@/components/ui/Button';
import { useWorkflowStore } from '@/store/workflowStore';
import { triggerTask, pollTaskResult } from '@/lib/triggerClient';
import { resolveNodeInputs } from '@/lib/resolveNodeInputs';
import { cn } from '@/lib/cn';

export function CropNode({ id, data, selected }: NodeProps) {
  const { updateNodeData, updateNodeStatus, addRun } = useWorkflowStore();
  const isRunning = data.status === 'running';

  async function handleRun() {
    const startTime = Date.now();

    updateNodeStatus(id, 'running');

    try {
      const { nodes, edges } = useWorkflowStore.getState();
      const inputs = resolveNodeInputs(id, nodes, edges);

      const imageUrl = (inputs.image_url as string) ?? data.outputUrl;

      if (!imageUrl) {
        throw new Error('No image connected or uploaded');
      }

      const { runId } = await triggerTask('crop-image', {
        imageUrl,
        x: Number(inputs.x_percent ?? data.cropX ?? 0),
        y: Number(inputs.y_percent ?? data.cropY ?? 0),
        width: Number(data.cropW ?? 100),
        height: Number(data.cropH ?? 100),
      });

      const result = await pollTaskResult(runId, (status) => {
        updateNodeStatus(id, status);
      });

      const outputUrl = result.outputUrl as string;
      const durationMs = Date.now() - startTime;

      updateNodeData(id, {
        output: outputUrl,
        status: 'success',
      });

      addRun({
        timestamp: new Date(),
        scope: 'single',
        scopeLabel: 'Single Node',
        status: 'success',
        durationMs,
        nodeResults: [
          {
            nodeId: id,
            nodeName: `Crop Image (${id})`,
            status: 'success',
            durationMs,
            output: outputUrl,
          },
        ],
      });
    } catch (err) {
      updateNodeStatus(id, 'failed');
      updateNodeData(id, {
        error: err instanceof Error ? err.message : String(err),
      });
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
        <div className="flex items-center justify-between mb-2 pl-3">
          <span className="text-[10px] text-[#505050]">image input</span>
          <span className="text-[9px] text-[#f87171]">required</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 mb-2">
          {[
            { key: 'cropX', label: 'X %', default: '0' },
            { key: 'cropY', label: 'Y %', default: '0' },
            { key: 'cropW', label: 'W %', default: '100' },
            { key: 'cropH', label: 'H %', default: '100' },
          ].map(({ key, label, default: defaultValue }) => (
            <div key={key}>
              <label className="block text-[9px] text-[#505050] uppercase tracking-[0.5px] mb-1">
                {label}
              </label>
              <input
                type="number"
                className="node-input"
                min={0}
                max={100}
                value={data[key] ?? defaultValue}
                disabled={data[`${key}_connected`]}
                onChange={(e) => updateNodeData(id, { [key]: e.target.value })}
              />
            </div>
          ))}
        </div>

        <div className="space-y-1 mb-2">
          <div className="flex items-center pl-3">
            <span className="text-[9px] text-[#404040]">x (from node) - optional</span>
          </div>
          <div className="flex items-center pl-3">
            <span className="text-[9px] text-[#404040]">y (from node) - optional</span>
          </div>
        </div>

        {data.output && (
          <div className="mb-2">
            <div className="relative rounded-[6px] overflow-hidden bg-[#1a1a1a]" style={{ aspectRatio: '16/9' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.output as string} alt="cropped preview" className="w-full h-full object-cover" />
            </div>
            <p className="text-[10px] text-[#505050] mt-1.5 truncate" style={{ fontFamily: 'var(--mono)' }}>
              {'->'} {data.output}
            </p>
          </div>
        )}

        <Button
          variant="node"
          loading={isRunning}
          icon={!isRunning ? <Play size={10} /> : undefined}
          onClick={handleRun}
        >
          {isRunning ? 'Processing...' : 'Run Crop'}
        </Button>

        <div className="flex justify-end mt-3 pr-2">
          <span className="text-[10px] text-[#505050]">cropped image</span>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        id="image_url"
        style={{ top: 72, background: '#4ade80', borderColor: '#22c55e' }}
        title="Input: Image URL (image)"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="x_percent"
        style={{ top: 194, background: '#222', borderColor: 'rgba(255,255,255,0.2)' }}
        title="Input: X percent (text/number)"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="y_percent"
        style={{ top: 212, background: '#222', borderColor: 'rgba(255,255,255,0.2)' }}
        title="Input: Y percent (text/number)"
      />

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ top: '50%', background: '#4ade80', borderColor: '#22c55e' }}
        title="Output: Cropped Image URL"
      />
    </div>
  );
}
