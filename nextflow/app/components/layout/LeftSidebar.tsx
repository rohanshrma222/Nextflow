'use client';
import { useCallback, useState } from 'react';
import {
  FileText, Image as ImageIcon, Video, MessageSquare,
  Crop, Film, PanelLeftClose, PanelLeft
} from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import { buildNode } from '@/lib/utils';
import { NODE_DEFINITIONS, NodeType } from '@/types';
import { cn } from '@/lib/cn';

const ICONS: Record<NodeType, React.ReactNode> = {
  text:  <FileText  size={18} strokeWidth={1.5} />,
  image: <ImageIcon size={18} strokeWidth={1.5} />,
  video: <Video     size={18} strokeWidth={1.5} />,
  llm:   <MessageSquare size={18} strokeWidth={1.5} />,
  crop:  <Crop      size={18} strokeWidth={1.5} />,
  frame: <Film      size={18} strokeWidth={1.5} />,
};

// Colors mapping to some exact ones seen in the image if we had them, 
// but we will use the default icon theme styles per the node type.
const ICON_COLORS: Record<NodeType, string> = {
  text:  '#60a5fa',
  image: '#4ade80',
  video: '#fbbf24',
  llm:   '#a78bfa',
  crop:  '#f87171',
  frame: '#fbbf24',
};

export function LeftSidebar() {
  const { addNode } = useWorkflowStore();
  // Manage toggle state
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [draggingType, setDraggingType] = useState<NodeType | null>(null);

  const handleClick = useCallback((type: NodeType) => {
    const cx = window.innerWidth / 2 + (Math.random() * 60 - 30);
    const cy = window.innerHeight / 2 + (Math.random() * 60 - 30);
    const node = buildNode(type, { x: cx, y: cy });
    addNode(node);
  }, [addNode]);

  const handleDragStart = useCallback((e: React.DragEvent, type: NodeType) => {
    setDraggingType(type);
    e.dataTransfer.setData('application/nextflow-node', type);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  return (
    <aside
      className="flex flex-col h-full border-r border-[#1a1a1a] py-3 z-40 relative flex-shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
      style={{
        width: isCollapsed ? 64 : 255,
        background: '#030303',
      }}
    >
      {/* Top Toggle */}
      <div className={cn("flex px-4 mb-4", isCollapsed ? 'justify-center' : 'justify-start')}>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#888] hover:bg-white/5 hover:text-white transition-colors"
        >
          {isCollapsed ? <PanelLeft size={18} strokeWidth={1.5} /> : <PanelLeftClose size={18} strokeWidth={1.5} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-3">
        {/* Node tools */}
        <div className="flex flex-col gap-[2px] w-full items-center mt-2">
          {NODE_DEFINITIONS.map((def) => {
            return (
              <button
                key={def.type}
                draggable
                onDragStart={(e) => handleDragStart(e, def.type)}
                onDragEnd={() => setDraggingType(null)}
                onClick={() => handleClick(def.type)}
                title={isCollapsed ? def.label : undefined}
                className={cn(
                  'flex items-center rounded-xl transition-all duration-200 cursor-grab active:cursor-grabbing w-full',
                  draggingType === def.type && 'opacity-50',
                  isCollapsed ? "justify-center w-10 h-10 mx-auto text-[#888] hover:bg-[#1a1a1a] hover:text-white" : "justify-start px-3 py-2.5 gap-3 hover:bg-[#111] text-[#d0d0d0]"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center p-1 rounded-[6px] transition-colors",
                  !isCollapsed && "bg-white/5"
                )}>
                  {ICONS[def.type]}
                </div>
                {!isCollapsed && <span className="text-[13.5px] font-[500]">{def.label}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Avatar at bottom */}
      <div className={cn("mt-auto px-4 pt-4 border-t border-[#1a1a1a]", isCollapsed ? 'flex justify-center' : '')}>
        <div className={cn(
          "flex items-center cursor-pointer rounded-xl hover:bg-[#111] transition-colors",
          isCollapsed ? "justify-center w-10 h-10 mx-auto" : "px-2 py-2 gap-3"
        )}>
          <div 
            className="w-[30px] h-[30px] rounded-[8px] flex-shrink-0 flex items-center justify-center text-[12px] font-[500] text-[#ccc]"
            style={{ background: '#222' }}
          >
            E
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate flex-1 min-w-0">
              <span className="text-[13px] font-[500] text-[#f0f0f0] truncate text-left">
                evaluativecreativeg...
              </span>
              <span className="text-[11.5px] text-[#777] text-left leading-[1.2]">
                Free
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
