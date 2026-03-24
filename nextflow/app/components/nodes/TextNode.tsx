'use client';
import { Handle, Position, NodeProps } from 'reactflow';
import { TextCursor, Pen, Copy, Trash2 } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import { cn } from '@/lib/cn';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export function TextNode({ id, data, selected }: NodeProps) {
  const { updateNodeData, deleteNode, duplicateNode } = useWorkflowStore();
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClose = (e: MouseEvent) => {
      const menuEl = document.getElementById('text-node-context-menu');
      if (menuEl && menuEl.contains(e.target as Node)) return;
      setContextMenu(null);
    };
    document.addEventListener('mousedown', handleClose, { capture: true });
    return () => document.removeEventListener('mousedown', handleClose, { capture: true });
  }, [contextMenu]);

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
        <TextCursor size={14} className="text-[#ec4899]" />
        <span className="text-[14px] text-[#8a8a8a] font-medium leading-none">Text</span>
      </div>

      {/* Main Node Box */}
      <div className={cn(
        "w-[280px] rounded-[12px] border-[2.0px] bg-[#202020] flex flex-col relative shadow-xl transition-colors duration-[400ms]",
        selected ? "border-[#ec4899]" : "border-transparent"
      )}>
        {/* Handles row */}
        <div className="flex justify-between items-center px-[18px] pt-1 pb-3">
          <span className="text-[13px] text-[#777777] font-medium">Input</span>
          <span className="text-[13px] text-[#777777] font-medium">Output</span>
        </div>

        {/* mini toolbar */}
        <div className="flex justify-between items-center mb-2 px-7">
          <Pen size={12} className="text-[#555555]" />
          <button 
            className="text-[#888888] hover:text-[#cccccc] transition-colors"
            onClick={() => navigator.clipboard.writeText(data.content ?? '')}
            title="Copy text"
          >
            <Copy size={13} />
          </button>
        </div>

        {/* Text Area wrapper */}
        <div className="mx-[17px] mb-[20px] bg-[#171717] rounded-[7px] p-0.5 pb-5 flex flex-col border border-[#222222] shadow-[inset_0_-1px_0_0_#3a3a3a]">
          <textarea
            className="w-full bg-transparent text-[13px] text-[#cccccc] placeholder:text-[#555555] resize-none outline-none px-1 pb-1"
            rows={5}
            placeholder="Write something..."
            value={data.content ?? ''}
            onChange={(e) => updateNodeData(id, { content: e.target.value, output: e.target.value || null })}
          />
        </div>

        {/* Handles */}
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          className="!bg-[#ec4899] !border-none !w-[12px] !h-[12px] !left-[-7px] !top-[15px] z-50 shadow-[0_0_0_6px_rgba(236,72,153,0.15)]"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          className="!bg-[#ec4899] !border-none !w-[12px] !h-[12px] !right-[-7px] !top-[15px] z-50 shadow-[0_0_0_6px_rgba(236,72,153,0.15)]"
        />
      </div>

      {/* Context Menu */}
      {contextMenu && typeof document !== 'undefined' && createPortal(
        <div 
          id="text-node-context-menu"
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
