'use client';
import { Handle, Position, NodeProps } from 'reactflow';
import { Video } from 'lucide-react';
import { NodeHeader } from '@/components/ui/NodeHeader';
import { UploadZone } from '@/components/ui/UploadZone';
import { useWorkflowStore } from '@/store/workflowStore';
import { cn } from '@/lib/cn';

export function VideoNode({ id, data, selected }: NodeProps) {
  const { updateNodeData } = useWorkflowStore();

  return (
    <div className={cn('flow-node group', data.status === 'running' && 'node-running', selected && 'selected')}>
      <NodeHeader
        nodeId={id}
        title="Upload Video"
        iconBg="rgba(251,191,36,0.12)"
        icon={<Video size={11} color="#fbbf24" />}
        status={data.status}
      />
      <div className="px-3 pt-[10px] pb-3">
        {data.previewUrl ? (
          <div>
            <video
              src={data.previewUrl}
              controls
              className="w-full rounded-[6px] bg-black"
              style={{ maxHeight: 110 }}
            />
            <button
              className="mt-1.5 text-[10px] text-[#505050] hover:text-[#9b6dff] transition-colors"
              onClick={() => updateNodeData(id, { previewUrl: null, fileName: null })}
            >
              Change video
            </button>
          </div>
        ) : (
          <UploadZone
            icon="🎬"
            accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
            acceptLabel="mp4 · mov · webm · m4v"
            onFile={(file, url) =>
              updateNodeData(id, { previewUrl: url, fileName: file.name, outputUrl: url })
            }
          />
        )}
        {data.fileName && !data.previewUrl && (
          <p className="text-[10px] text-[#505050] mt-1.5 truncate">{data.fileName}</p>
        )}
        <div className="flex justify-end mt-3 pr-2">
          <span className="text-[10px] text-[#505050]">video output</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#fbbf24', borderColor: '#f59e0b', top: '50%' }}
        title="Output: Video URL"
      />
    </div>
  );
}
