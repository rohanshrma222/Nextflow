'use client';
import { Handle, Position, NodeProps } from 'reactflow';
import { Film, Play, Trash2, Copy, Loader2 } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import { triggerTask, pollTaskResult } from '@/lib/triggerClient';
import { resolveNodeInputs } from '@/lib/resolveNodeInputs';
import { cn } from '@/lib/cn';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export function FrameNode({ id, data, selected }: NodeProps) {
  const { updateNodeData, updateNodeStatus, addRun, deleteNode, duplicateNode } = useWorkflowStore();
  const isRunning = data.status === 'running';
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClose = (e: MouseEvent) => {
      const menuEl = document.getElementById('frame-node-context-menu');
      if (menuEl && menuEl.contains(e.target as Node)) return;
      setContextMenu(null);
    };
    document.addEventListener('mousedown', handleClose, { capture: true });
    return () => document.removeEventListener('mousedown', handleClose, { capture: true });
  }, [contextMenu]);

  async function handleRun(e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    const startTime = Date.now();
    updateNodeStatus(id, 'running');

    try {
      const { nodes, edges } = useWorkflowStore.getState();
      const inputs = resolveNodeInputs(id, nodes, edges);
      const videoUrl = (inputs.video_url as string) ?? data.outputUrl ?? data.previewUrl;

      if (!videoUrl) throw new Error('No video connected or uploaded');

      const timestamp = (inputs.timestamp as string) ?? data.timestamp ?? '50%';

      const { runId } = await triggerTask('extract-frame', {
        videoUrl,
        timestamp,
      });

      const result = await pollTaskResult(runId, (status) => {
        updateNodeStatus(id, status);
      });

      const outputUrl = result.outputUrl as string;
      const durationMs = Date.now() - startTime;

      updateNodeData(id, { output: outputUrl, status: 'success' });

      addRun({
        timestamp: new Date(),
        scope: 'single',
        scopeLabel: 'Single Node',
        status: 'success',
        durationMs,
        nodeResults: [{
          nodeId: id,
          nodeName: `Extract Frame (${id})`,
          status: 'success',
          durationMs,
          output: outputUrl,
        }],
      });
    } catch (err) {
      updateNodeStatus(id, 'failed');
      updateNodeData(id, { error: err instanceof Error ? err.message : String(err) });
    }
  }

  return (
    <div 
      className={cn('flow-node group flex flex-col', selected && 'selected')}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      {/* Node Header outside the main box */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <Film size={14} className="text-[#fbbf24]" />
          <span className="text-[14px] text-[#8a8a8a] font-medium leading-none">Extract Frame</span>
        </div>
      </div>

      {/* Main Node Box */}
      <div className={cn(
        "w-[260px] rounded-[12px] border-[2.0px] bg-[#202020] flex flex-col relative shadow-xl transition-colors duration-[400ms]",
        selected ? "border-[#fbbf24]" : "border-transparent"
      )}>
        
        {/* Top Preview Area (Flush with top border) */}
        <div className="bg-[#141414] w-full min-h-[140px] rounded-t-[10px] flex items-center justify-center p-2 border-b border-[#2a2a2a] relative">
           {isRunning && (
             <div className="absolute inset-0 bg-[#141414]/60 flex items-center justify-center rounded-t-[10px] z-10 backdrop-blur-[2px]">
                <Loader2 size={24} className="text-[#fbbf24] animate-spin drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]" />
             </div>
           )}
           {data.output ? (
             <img src={data.output as string} alt="frame preview" className="w-full h-full object-contain rounded-[6px]" style={{ maxHeight: '180px' }} />
           ) : (
             <div className="flex flex-col items-center justify-center opacity-40">
                <Film size={24} className="mb-2 text-[#fbbf24]" />
                <span className="text-[11px] text-[#888888] font-medium">Results will appear here</span>
             </div>
           )}

           {/* Primary Handles explicitly centered on the preview block */}
           <Handle
             type="target"
             position={Position.Left}
             id="video_url"
             className="!bg-[#fbbf24] !border-none !w-[12px] !h-[12px] !left-[-7px] !top-1/2 z-50 shadow-[0_0_0_6px_rgba(251,191,36,0.15)]"
           />
           <Handle
             type="source"
             position={Position.Right}
             id="output"
             className="!bg-[#fbbf24] !border-none !w-[12px] !h-[12px] !right-[-7px] !top-1/2 z-50 shadow-[0_0_0_6px_rgba(251,191,36,0.15)]"
           />
        </div>

        {/* Bottom Config Area */}
        <div className="flex flex-col pt-4 pb-4">
          {/* Inputs Box */}
          <div className="mx-[17px] mb-[12px] bg-[#171717] rounded-[7px] p-2.5 pb-3 flex flex-col border border-[#222222] shadow-[inset_0_-1px_0_0_#3a3a3a]">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[#666666] uppercase font-semibold pl-1">
                Timestamp
              </label>
              <input
                type="text"
                className="w-full h-[28px] bg-[#111111] border border-[#2a2a2a] rounded-[4px] px-2 text-[12px] text-[#cccccc] outline-none focus:border-[#fbbf24] transition-colors"
                placeholder='e.g. 5 or "50%"'
                value={data.timestamp ?? '50%'}
                disabled={data.timestamp_connected}
                onChange={(e) => updateNodeData(id, { timestamp: e.target.value })}
              />
            </div>
          </div>

          {/* Optional input Handles */}
          <div className="relative flex flex-col px-[18px] gap-2 mb-[15px]">
            <div className="relative flex items-center h-[16px]">
               <span className="text-[11px] text-[#555555]">Timestamp Override (Optional)</span>
               <Handle type="target" position={Position.Left} id="timestamp" className="!bg-[#fbbf24] !border-none !w-[8px] !h-[8px] !left-[-7px] !top-1/2 z-50 shadow-[0_0_0_4px_rgba(251,191,36,0.15)] flex justify-center items-center" />
            </div>
          </div>

          {/* Run Button Area */}
          <div className="px-[17px] mt-auto">
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="w-full h-[32px] bg-[#fbbf24] hover:bg-[#d97706] text-[#222222] rounded-[6px] flex justify-center items-center gap-2 text-[13px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-[#fbbf24]"
            >
              {isRunning ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span className="animate-pulse">Extracting...</span>
                </>
              ) : (
                <>
                  <Play size={13} className="fill-current" />
                  <span>Extract Frame</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && typeof document !== 'undefined' && createPortal(
        <div 
          id="frame-node-context-menu"
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
