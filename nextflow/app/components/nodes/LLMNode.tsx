'use client';
import { Handle, Position, NodeProps } from 'reactflow';
import { MessageSquare, Play, Trash2, Copy, Loader2, ChevronDown } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import { triggerTask, pollTaskResult } from '@/lib/triggerClient';
import { resolveNodeInputs } from '@/lib/resolveNodeInputs';
import { cn } from '@/lib/cn';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const MODELS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash-Lite' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
];

function normalizeImageInputs(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string' && Boolean(item))
      .flatMap((item) => item.split(','))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function getErrorMessage(error: unknown): string {
  if (typeof error !== 'string' || !error.trim()) {
    return 'Something went wrong while running the model. Please try again.';
  }

  if (error === 'No user message connected') {
    return 'Connect a user message before running this node.';
  }

  return error;
}

export function LLMNode({ id, data, selected }: NodeProps) {
  const { updateNodeData, updateNodeStatus, addRun, deleteNode, duplicateNode } = useWorkflowStore();
  const isRunning = data.status === 'running';
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClose = (e: MouseEvent) => {
      const menuEl = document.getElementById('llm-node-context-menu');
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
    updateNodeData(id, { output: null, error: null });

    try {
      const { nodes, edges } = useWorkflowStore.getState();
      const inputs = resolveNodeInputs(id, nodes, edges);
      const systemPrompt = (inputs.system_prompt as string) ?? (data.systemPrompt as string) ?? '';
      const userMessage = (inputs.user_message as string) ?? (data.userMessage as string) ?? '';
      const images = normalizeImageInputs(inputs.images);

      if (!userMessage.trim()) throw new Error('No user message connected');

      const { runId } = await triggerTask('run-llm', {
        model: (data.model as string) ?? 'gemini-2.5-flash',
        systemPrompt,
        userMessage,
        images,
      });

      const result = await pollTaskResult(runId, (status) => {
        updateNodeStatus(id, status);
      });

      const output = result.output as string;
      const durationMs = Date.now() - startTime;

      updateNodeData(id, { output, status: 'success' });

      addRun({
        timestamp: new Date(),
        scope: 'single',
        scopeLabel: 'Single Node',
        status: 'success',
        durationMs,
        nodeResults: [{
          nodeId: id,
          nodeName: `LLM Node (${id})`,
          status: 'success',
          durationMs,
          output,
        }],
      });
    } catch (error) {
      updateNodeStatus(id, 'failed');
      updateNodeData(id, { error: error instanceof Error ? error.message : String(error) });
    }
  }

  const selectedModelLabel = MODELS.find(m => m.value === (data.model || 'gemini-2.5-flash'))?.label;

  return (
    <div 
      className={cn('flow-node group flex flex-col', selected && 'selected')}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      {/* Dynamic Header outside the main box */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[14px] text-[#8a8a8a] font-medium leading-none pl-1">
          {selectedModelLabel}
        </span>
        <span className="text-[10px] text-[#555] font-medium pr-1">LLM</span>
      </div>

      {/* Main Node Box */}
      <div className={cn(
        "w-[260px] rounded-[12px] border-[2.0px] bg-[#202020] flex flex-col relative shadow-xl transition-colors duration-[400ms]",
        selected ? "border-[#9b6dff]" : "border-[transparent]"
      )}>
        
        {/* Top Preview Area (Flush with top border) */}
        <div className="bg-[#141414] w-full min-h-[140px] rounded-t-[10px] flex items-center justify-center p-3 border-b border-[#2a2a2a] relative">
           {isRunning ? (
             <span className="text-[12px] text-[#555555] font-medium animate-pulse">
               Results will appear here
             </span>
           ) : data.error ? (
             <div className="w-full rounded-[8px] border border-red-500/20 bg-red-500/8 px-3 py-2 text-left">
               <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#f87171]">
                 Run failed
               </p>
               <p className="mt-1 text-[12px] leading-[1.5] text-[#f3b1b1]">
                 {getErrorMessage(data.error)}
               </p>
             </div>
           ) : data.output ? (
             <div className="w-full max-h-[220px] overflow-y-auto text-left text-[12px] text-[#cccccc] leading-[1.6] scrollbar-hide py-1 font-sans">
               {data.output as string}
             </div>
           ) : (
             <span className="text-[12px] text-[#555555] font-medium">Results will appear here</span>
           )}
        </div>

        {/* Bottom Config Area */}
        <div className="flex flex-col pt-3 pb-4">
           {/* Output Handle Row */}
           <div className="relative flex items-center justify-end px-[18px] mb-4">
              <span className="text-[12px] text-[#888] font-medium mr-2">Output</span>
              <Handle type="source" position={Position.Right} id="output" className="!bg-[#9b6dff] !border-none !w-[10px] !h-[10px] !right-[-7px] !top-[8px] z-50 shadow-[0_0_0_5px_rgba(155,109,255,0.15)]" />
           </div>

           {/* Model Dropdown Row */}
           <div className="flex items-center justify-between px-[18px] mb-4">
              <span className="text-[12px] text-[#777777] font-medium">Model</span>
              <div className="relative group">
                 <MessageSquare size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#888888] group-hover:text-[#9b6dff] transition-colors" />
                 <select
                   className="w-[140px] h-[26px] bg-[#111111] border border-[#2a2a2a] rounded-[6px] pl-7 pr-2 text-[11px] text-[#cccccc] font-medium outline-none focus:border-[#9b6dff] transition-colors appearance-none cursor-pointer"
                   value={(data.model as string) ?? 'gemini-2.5-flash'}
                   onChange={(e) => updateNodeData(id, { model: e.target.value })}
                 >
                   {MODELS.map((model) => (
                     <option key={model.value} value={model.value}>{model.label}</option>
                   ))}
                 </select>
                 <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none" />
              </div>
           </div>

           {/* Input Handles Row */}
           <div className="relative flex flex-col px-[18px] gap-3">
              <div className="relative flex items-center min-h-[16px]">
                <Handle type="target" position={Position.Left} id="system_prompt" className="!bg-[#9b6dff] !border-none !w-[10px] !h-[10px] !left-[-7px] !top-1/2 z-50 shadow-[0_0_0_5px_rgba(155,109,255,0.15)] flex justify-center items-center" />
                <span className="text-[12px] text-[#777777] font-medium ml-2">System Prompt</span>
              </div>
              <div className="relative flex items-center min-h-[16px]">
                <Handle type="target" position={Position.Left} id="user_message" className="!bg-[#9b6dff] !border-none !w-[10px] !h-[10px] !left-[-7px] !top-1/2 z-50 shadow-[0_0_0_5px_rgba(155,109,255,0.15)] flex justify-center items-center" />
                <span className="text-[12px] text-[#dddddd] font-medium ml-2">User Message</span>
              </div>
              <div className="relative flex items-center min-h-[16px]">
                <Handle type="target" position={Position.Left} id="images" className="!bg-[#9b6dff] !border-none !w-[10px] !h-[10px] !left-[-7px] !top-1/2 z-50 shadow-[0_0_0_5px_rgba(155,109,255,0.15)] flex justify-center items-center" />
                <span className="text-[12px] text-[#777777] font-medium ml-2">Images</span>
              </div>
           </div>

           {/* Action Button */}
           <div className="px-[18px] pt-5">
             <button
               onClick={handleRun}
               disabled={isRunning}
               className="w-full h-[32px] bg-[#9b6dff] hover:bg-[#8659eb] text-white rounded-[6px] flex justify-center items-center gap-2 text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             >
              {isRunning ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span className="animate-pulse">Running...</span>
                </>
              ) : (
                 <>
                   <Play size={13} className="fill-current" />
                   <span>Run Node</span>
                 </>
               )}
             </button>
           </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && typeof document !== 'undefined' && createPortal(
        <div 
          id="llm-node-context-menu"
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
