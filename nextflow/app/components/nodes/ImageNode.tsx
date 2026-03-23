'use client';
import { Handle, Position, NodeProps } from 'reactflow';
import { Image as ImageIcon } from 'lucide-react';
import { NodeHeader } from '@/components/ui/NodeHeader';
import { UploadZone } from '@/components/ui/UploadZone';
import { useWorkflowStore } from '@/store/workflowStore';
import { cn } from '@/lib/cn';

export function ImageNode({ id, data, selected }: NodeProps) {
  const { updateNodeData } = useWorkflowStore();

  return (
    <div className={cn('flow-node group', data.status === 'running' && 'node-running', selected && 'selected')}>
      <NodeHeader
        nodeId={id}
        title="Upload Image"
        iconBg="rgba(74,222,128,0.12)"
        icon={<ImageIcon size={11} color="#4ade80" />}
        status={data.status}
      />
      <div className="px-3 pt-[10px] pb-3">
        {data.previewUrl ? (
          <div className="relative rounded-[6px] overflow-hidden bg-[#1a1a1a]" style={{ aspectRatio: '16/9' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.previewUrl} alt="preview" className="w-full h-full object-cover" />
            <button
              className="absolute top-1.5 right-1.5 bg-[rgba(0,0,0,0.7)] border border-[rgba(255,255,255,0.12)] rounded px-2 py-0.5 text-[10px] text-[#a0a0a0] hover:text-[#f0f0f0] transition-colors"
              onClick={() => updateNodeData(id, { previewUrl: null, fileName: null })}
            >
              Change
            </button>
          </div>
        ) : (
          <UploadZone
            templateId={process.env.NEXT_PUBLIC_TRANSLOADIT_IMAGE_TEMPLATE_ID ?? ''}
            accept="image/jpeg,image/png,image/webp,image/gif"
            acceptLabel={'jpg \u00b7 jpeg \u00b7 png \u00b7 webp \u00b7 gif'}
            icon={'\u{1F5BC}\uFE0F'}
            onUploadComplete={(url, fileName) =>
              updateNodeData(id, {
                previewUrl: url,
                fileName,
                outputUrl: url,
                status: 'success',
              })
            }
            onUploadError={(err) =>
              updateNodeData(id, { status: 'failed', uploadError: err })
            }
          />
        )}
        {data.fileName && (
          <p className="text-[10px] text-[#505050] mt-1.5 truncate">{data.fileName}</p>
        )}
        <div className="flex justify-end mt-3 pr-2">
          <span className="text-[10px] text-[#505050]">image output</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#4ade80', borderColor: '#22c55e', top: '50%' }}
        title="Output: Image URL"
      />
    </div>
  );
}
