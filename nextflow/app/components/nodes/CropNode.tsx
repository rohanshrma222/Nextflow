'use client';
import { Handle, Position, NodeProps } from 'reactflow';
import { Crop, Play, Trash2, Copy, Loader2 } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import { triggerTask, pollTaskResult } from '@/lib/triggerClient';
import { resolveNodeInputs } from '@/lib/resolveNodeInputs';
import { cn } from '@/lib/cn';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export function CropNode({ id, data, selected }: NodeProps) {
  const { updateNodeData, updateNodeStatus, addRun, deleteNode, duplicateNode } = useWorkflowStore();
  const isRunning = data.status === 'running';
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClose = (e: MouseEvent) => {
      const menuEl = document.getElementById('crop-node-context-menu');
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

      const imageUrl = (inputs.image as string) ?? data.outputUrl ?? data.previewUrl;
      if (!imageUrl) throw new Error('No image connected or uploaded');

      const xPercent = Number(inputs.x_percent ?? data.xPercent ?? 0);
      const yPercent = Number(inputs.y_percent ?? data.yPercent ?? 0);
      const widthPercent = Number(inputs.width_percent ?? data.widthPercent ?? 100);
      const heightPercent = Number(inputs.height_percent ?? data.heightPercent ?? 100);

      const { runId } = await triggerTask('crop-image', {
        imageUrl,
        xPercent,
        yPercent,
        widthPercent,
        heightPercent,
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
          nodeName: `Crop Image (${id})`,
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
      className={cn('flow-node group flex flex-col', isRunning && 'node-running', selected && 'selected')}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      {/* Node Header outside the main box */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <Crop size={14} className="text-[#ef4444]" />
          <span className="text-[14px] text-[#8a8a8a] font-medium leading-none">Crop Image</span>
        </div>
      </div>

      {/* Main Node Box */}
      <div className={cn(
        "w-[260px] rounded-[12px] border-[2.0px] bg-[#202020] flex flex-col relative shadow-xl transition-colors duration-[400ms]",
        selected ? "border-[#ef4444]" : "border-transparent"
      )}>
        
        {/* Top Preview Area (Flush with top border) */}
        <div className="bg-[#141414] w-full min-h-[140px] rounded-t-[10px] flex items-center justify-center p-2 border-b border-[#2a2a2a] relative">
           {isRunning && (
             <div className="absolute inset-0 bg-[#141414]/60 flex items-center justify-center rounded-t-[10px] z-10 backdrop-blur-[2px]">
                <Loader2 size={24} className="text-[#ef4444] animate-spin drop-shadow-[0_0_6px_rgba(239,68,68,0.4)]" />
             </div>
           )}
           {data.output ? (
             // eslint-disable-next-line @next/next/no-img-element
             <img src={data.output as string} alt="cropped preview" className="w-full h-full object-contain rounded-[6px]" style={{ maxHeight: '180px' }} />
           ) : (
             <div className="flex flex-col items-center justify-center opacity-40">
                <Crop size={24} className="mb-2 text-[#ef4444]" />
                <span className="text-[11px] text-[#888888] font-medium">Results will appear here</span>
             </div>
           )}

           {/* Primary Handles centered on the preview box */}
           <Handle
             type="target"
             position={Position.Left}
             id="image"
             className="!bg-[#ef4444] !border-none !w-[12px] !h-[12px] !left-[-7px] !top-1/2 z-50 shadow-[0_0_0_6px_rgba(239,68,68,0.15)]"
           />
           <Handle
             type="source"
             position={Position.Right}
             id="output"
             className="!bg-[#ef4444] !border-none !w-[12px] !h-[12px] !right-[-7px] !top-1/2 z-50 shadow-[0_0_0_6px_rgba(239,68,68,0.15)]"
           />
        </div>

        {/* Bottom Config Area */}
        <div className="flex flex-col pt-4 pb-4">
          {/* Inputs Box */}
          <div className="mx-[17px] mb-[12px] bg-[#171717] rounded-[7px] p-2.5 pb-4 flex flex-col border border-[#222222] shadow-[inset_0_-1px_0_0_#3a3a3a]">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[#666666] uppercase font-semibold pl-1">X %</label>
                <input
                  type="number"
                  className="w-full h-[28px] bg-[#111111] border border-[#2a2a2a] rounded-[4px] px-2 text-[12px] text-[#cccccc] outline-none focus:border-[#ef4444] transition-colors"
                  value={data.xPercent ?? 0}
                  disabled={data.x_percent_connected}
                  onChange={(e) => updateNodeData(id, { xPercent: Number(e.target.value) })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[#666666] uppercase font-semibold pl-1">Y %</label>
                <input
                  type="number"
                  className="w-full h-[28px] bg-[#111111] border border-[#2a2a2a] rounded-[4px] px-2 text-[12px] text-[#cccccc] outline-none focus:border-[#ef4444] transition-colors"
                  value={data.yPercent ?? 0}
                  disabled={data.y_percent_connected}
                  onChange={(e) => updateNodeData(id, { yPercent: Number(e.target.value) })}
                />
              </div>
              <div className="flex flex-col gap-1 mt-1">
                <label className="text-[10px] text-[#666666] uppercase font-semibold pl-1">W %</label>
                <input
                  type="number"
                  className="w-full h-[28px] bg-[#111111] border border-[#2a2a2a] rounded-[4px] px-2 text-[12px] text-[#cccccc] outline-none focus:border-[#ef4444] transition-colors"
                  value={data.widthPercent ?? 100}
                  onChange={(e) => updateNodeData(id, { widthPercent: Number(e.target.value) })}
                />
              </div>
              <div className="flex flex-col gap-1 mt-1">
                <label className="text-[10px] text-[#666666] uppercase font-semibold pl-1">H %</label>
                <input
                  type="number"
                  className="w-full h-[28px] bg-[#111111] border border-[#2a2a2a] rounded-[4px] px-2 text-[12px] text-[#cccccc] outline-none focus:border-[#ef4444] transition-colors"
                  value={data.heightPercent ?? 100}
                  onChange={(e) => updateNodeData(id, { heightPercent: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {/* Optional Overrides */}
          <div className="relative flex flex-col px-[18px] gap-2 mb-[15px]">
            <div className="relative flex items-center h-[16px]">
               <span className="text-[11px] text-[#555555]">X Override (Optional)</span>
               <Handle type="target" position={Position.Left} id="x_percent" className="!bg-[#ef4444] !border-none !w-[8px] !h-[8px] !left-[-7px] !top-1/2 z-50 shadow-[0_0_0_4px_rgba(239,68,68,0.15)] flex justify-center items-center" />
            </div>
            <div className="relative flex items-center h-[16px]">
               <span className="text-[11px] text-[#555555]">Y Override (Optional)</span>
               <Handle type="target" position={Position.Left} id="y_percent" className="!bg-[#ef4444] !border-none !w-[8px] !h-[8px] !left-[-7px] !top-1/2 z-50 shadow-[0_0_0_4px_rgba(239,68,68,0.15)] flex justify-center items-center" />
            </div>
          </div>

          {/* Run Button Area */}
          <div className="px-[17px] mt-auto">
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="w-full h-[32px] bg-[#ef4444] hover:bg-[#dc2626] text-white rounded-[6px] flex justify-center items-center gap-2 text-[13px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-[#ef4444]"
            >
              {isRunning ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Cropping...</span>
                </>
              ) : (
                <>
                  <Play size={13} className="fill-current" />
                  <span>Run Crop</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && typeof document !== 'undefined' && createPortal(
        <div 
          id="crop-node-context-menu"
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
