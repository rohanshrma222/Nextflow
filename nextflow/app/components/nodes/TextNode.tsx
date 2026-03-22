'use client';
import { Handle, Position, NodeProps } from 'reactflow';
import { FileText } from 'lucide-react';
import { NodeHeader } from '@/components/ui/NodeHeader';
import { useWorkflowStore } from '@/store/workflowStore';
import { cn } from '@/lib/cn';

export function TextNode({ id, data, selected }: NodeProps) {
  const { updateNodeData } = useWorkflowStore();

  return (
    <div className={cn('flow-node group', data.status === 'running' && 'node-running', selected && 'selected')}>
      <NodeHeader
        nodeId={id}
        title="Text Node"
        iconBg="rgba(96,165,250,0.15)"
        icon={<FileText size={11} color="#60a5fa" />}
        status={data.status}
      />
      <div className="px-3 pt-[10px] pb-3">
        <label className="block text-[10px] text-[#505050] uppercase tracking-[0.6px] mb-1.5">Content</label>
        <textarea
          className="node-textarea"
          rows={4}
          placeholder="Enter your text…"
          value={data.content ?? ''}
          onChange={(e) => updateNodeData(id, { content: e.target.value })}
        />
        <div className="flex items-center justify-end mt-3 pr-2">
          <span className="text-[10px] text-[#505050]">output (text)</span>
        </div>
      </div>

      {/* Output handle — right side */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#60a5fa', borderColor: '#3b82f6', top: '50%' }}
        title="Output: Text"
      />
    </div>
  );
}
