'use client';
import { Handle, Position, NodeProps } from 'reactflow';
import { Video, Upload, FileVideo, File, Loader2, X, Trash2, Copy } from 'lucide-react';
import { UploadZone } from '@/components/ui/UploadZone';
import { useWorkflowStore } from '@/store/workflowStore';
import { cn } from '@/lib/cn';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export function VideoNode({ id, data, selected }: NodeProps) {
  const { updateNodeData, deleteNode, duplicateNode } = useWorkflowStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploadState, setUploadState] = useState<string>('idle');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClose = (e: MouseEvent) => {
      const menuEl = document.getElementById('video-node-context-menu');
      if (menuEl && menuEl.contains(e.target as Node)) return;
      setContextMenu(null);
    };
    document.addEventListener('mousedown', handleClose, { capture: true });
    return () => document.removeEventListener('mousedown', handleClose, { capture: true });
  }, [contextMenu]);

  useEffect(() => {
    if (!menuOpen) return;
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handle, { capture: true });
    return () => document.removeEventListener('mousedown', handle, { capture: true });
  }, [menuOpen]);

  return (
    <div 
      className={cn('flow-node group flex flex-col', data.status === 'running' && 'node-running', selected && 'selected')}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      {/* Node Header outside the main box */}
      <div className="flex items-center gap-2 mb-2 pl-1">
        <Video size={14} className="text-[#22c55e]" />
        <span className="text-[14px] text-[#8a8a8a] font-medium leading-none">Video</span>
      </div>

      {/* Main Node Box */}
      <div className={cn(
        "w-[280px] rounded-[14px] border-[2.0px] bg-[#171717] flex flex-col relative shadow-xl transition-colors duration-[400ms]",
        selected ? "border-[#22c55e]" : "border-transparent"
      )}>
        {/* Content Area */}
        <div className="p-[3px]">
          {data.previewUrl ? (
            <div className="relative rounded-[11px] overflow-hidden bg-[#111111]" style={{ aspectRatio: '16/9' }}>
              <video
                src={data.previewUrl}
                controls
                className="w-full h-full object-cover bg-black"
                style={{ maxHeight: 154 }}
              />
            </div>
          ) : (
            <div className="min-h-[150px] rounded-[11px] bg-[#171717] flex items-center justify-center overflow-hidden">
              <UploadZone
                templateId={process.env.NEXT_PUBLIC_TRANSLOADIT_VIDEO_TEMPLATE_ID ?? ''}
                accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
                acceptLabel={'mp4 \u00b7 mov \u00b7 webm \u00b7 m4v'}
                inputId={`upload-${id}`}
                hideBorder
                hideBackground
                disableClick
                onStateChange={(s) => setUploadState(s)}
                customIdleContent={
                  <div className="h-full w-full flex items-center justify-center group-hover:bg-[#171717]/50 transition-colors">
                    <span className="text-[13px] text-[#555555] font-medium tracking-wide">Results will appear here</span>
                  </div>
                }
                customUploadingContent={
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="text-[14px] text-[#555555] font-medium tracking-wide animate-pulse">Adding video...</span>
                  </div>
                }
                customProcessingContent={
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="text-[14px] text-[#555555] font-medium tracking-wide animate-pulse">Adding video...</span>
                  </div>
                }
                onUploadComplete={(url, fileName) => {
                  setUploadState('done');
                  updateNodeData(id, {
                    previewUrl: url,
                    fileName,
                    outputUrl: url,
                    status: 'success',
                  });
                }}
                onUploadError={(err) =>
                  updateNodeData(id, { status: 'failed', uploadError: err })
                }
              />
            </div>
          )}
        </div>

        {/* Bottom Area */}
        <div className="bg-[#2a2a2a] py-[15px] px-[8px] pt-2 pb-6 rounded-b-[13px]" ref={menuRef}>
          <div className="relative w-[220px] ml-5">
            {uploadState === 'uploading' || uploadState === 'processing' ? (
              <div
                className="w-full h-[30px] bg-[#1a1a1a] rounded-[6px] flex items-center justify-between px-2.5 text-[13px] font-medium text-[#777777] border border-[#4d4d4d]"
              >
                <span>Uploading...</span>
                <Loader2 size={13} className="text-[#555555] animate-spin" />
              </div>
            ) : data.previewUrl ? (
              <div
                className="w-full h-[30px] bg-[#1a1a1a] rounded-[6px] flex items-center justify-between px-2 text-[13px] font-medium text-[#f0f0f0] border border-[#4d4d4d]"
              >
                <div className="flex items-center gap-2">
                  <div className="w-[18px] h-[18px] rounded-[4px] bg-[#222] flex items-center justify-center">
                    <FileVideo size={10} className="text-[#aaaaaa]"/>
                  </div>
                  <span>Added file</span>
                </div>
                <button
                  className="text-[#666666] hover:text-[#aaaaaa] transition-colors"
                  onClick={() => {
                    updateNodeData(id, { previewUrl: null, fileName: null, outputUrl: null, status: 'idle' });
                    setUploadState('idle');
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                className="w-full h-[30px] bg-[#1a1a1a] rounded-[6px] flex items-center justify-between px-2.5 text-[12px] font-medium text-[#999999] hover:text-[#bbbbbb] transition-colors border border-[#4d4d4d]"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <span>Add file</span>
                <File size={13} className="text-[#666666]" />
              </button>
            )}

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#111111] border border-white/5 rounded-[10px] p-1.5 z-[100] shadow-2xl animate-menu">
                <button
                  className="flex items-center gap-2.5 w-full p-2 hover:bg-[#222222] text-[#cccccc] font-medium rounded-[6px] cursor-pointer text-[12px] text-left transition-colors"
                  onClick={() => {
                    document.getElementById(`upload-${id}`)?.click();
                    setMenuOpen(false);
                  }}
                >
                  <div className="w-[18px] h-[18px] rounded-[4px] bg-[#222] flex flex-shrink-0 items-center justify-center">
                    <Upload size={10} className="text-[#aaaaaa]" />
                  </div>
                  Upload file
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Handles */}
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          className="!bg-[#22c55e] !border-none !w-[12px] !h-[12px] !left-[-7px] !top-auto !bottom-[14px] z-50 shadow-[0_0_0_6px_rgba(34,197,94,0.15)]"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          className="!bg-[#22c55e] !border-none !w-[12px] !h-[12px] !right-[-7px] !top-auto !bottom-[14px] z-50 shadow-[0_0_0_6px_rgba(34,197,94,0.15)]"
        />
      </div>

      {/* Context Menu */}
      {contextMenu && typeof document !== 'undefined' && createPortal(
        <div 
          id="video-node-context-menu"
          className="fixed z-[99999] bg-[#111111] border border-white/5 rounded-[12px] p-1.5 shadow-2xl min-w-[210px] animate-menu flex flex-col"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <button 
            className="flex items-center justify-between w-full p-2.5 hover:bg-white/5 text-[#cccccc] font-medium rounded-[8px] text-[13px] text-left transition-colors"
            onClick={() => {
              setContextMenu(null);
              duplicateNode?.(id);
            }}
          >
            <div className="flex items-center gap-3">
              <Copy size={16} /> 
              Duplicate
            </div>
            <div className="flex items-center gap-1 text-[10px] text-[#666666] font-sans font-medium">
              <span className="bg-white/10 px-1.5 py-0.5 rounded-[4px]">⌘</span>
              <span className="bg-white/10 px-1.5 py-0.5 rounded-[4px]">D</span>
            </div>
          </button>

          <div className="h-[1px] bg-white/5 my-1 mx-1" />

          <button 
            className="flex items-center justify-between w-full p-2.5 hover:bg-red-500/10 text-[#ef4444] font-medium rounded-[8px] text-[13px] text-left transition-colors"
            onClick={() => {
              setContextMenu(null);
              deleteNode(id);
            }}
          >
            <div className="flex items-center gap-3">
              <Trash2 size={16} /> 
              Delete
            </div>
            <div className="flex items-center gap-1 text-[11px] text-red-500/50 font-sans">
              <span className="bg-red-500/10 px-1.5 py-0.5 rounded-[4px] leading-none">⌫</span>
            </div>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
