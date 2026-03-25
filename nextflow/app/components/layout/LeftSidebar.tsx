'use client';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { SignInButton, UserButton, useAuth } from '@clerk/nextjs';
import { PanelLeft, Search } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import { buildNode } from '@/lib/utils';
import { NODE_DEFINITIONS, NodeType } from '@/types';
import { cn } from '@/lib/cn';

const ICONS: Record<NodeType, React.ReactNode> = {
  text: (
    <img
      src="/textnode.png"
      alt="Text node"
      className="h-[20px] w-[20px] object-contain"
    />
  ),
  image: (
    <img
      src="/uploadimage.webp"
      alt="Upload image"
      className="h-[20px] w-[20px] object-contain"
    />
  ),
  video: (
    <img
      src="/uploadvideo.webp"
      alt="Upload video"
      className="h-[20px] w-[20px] object-contain"
    />
  ),
  llm: (
    <img
      src="/LLm.png"
      alt="LLM"
      className="h-[31px] w-[31px] object-contain"
    />
  ),
  crop: (
    <img
      src="/cropimage.png"
      alt="Crop image"
      className="h-[26px] w-[26px] object-contain"
    />
  ),
  frame: (
    <img
      src="/extractimage.png"
      alt="Extract frame"
      className="h-[26px] w-[26px] object-contain"
    />
  ),
};

export function LeftSidebar() {
  const { addNode } = useWorkflowStore();
  const { isSignedIn } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [draggingType, setDraggingType] = useState<NodeType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredNodes = NODE_DEFINITIONS.filter((def) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    return (
      def.label.toLowerCase().includes(query)
      || def.description.toLowerCase().includes(query)
      || def.type.toLowerCase().includes(query)
    );
  });

  return (
    <aside
      className="flex flex-col h-full border-r border-[#1a1a1a] py-3 z-40 relative flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
      style={{
        width: isCollapsed ? 64 : 255,
        background: '#030303',
        fontFamily: "var(--font-inter, 'Inter', sans-serif)",
        color: 'white',
      }}
    >
      <div className="flex px-4 mb-4 justify-start">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-colors shrink-0"
        >
          <PanelLeft size={18} strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-3">
        {!isCollapsed && (
          <div className="mb-3">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search nodes"
                className="h-10 w-full rounded-xl border border-white/5 bg-[#101010] pl-9 pr-3 text-[13px] text-[#f0f0f0] outline-none placeholder:text-[#666] focus:border-white/10"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 w-full mt-2">
          <Link
            href="/nodes"
            title={isCollapsed ? 'Home' : undefined}
            className="flex items-center rounded-xl px-1 py-2 gap-1 hover:bg-[#111] transition-colors duration-200 w-full"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-[6px] shrink-0">
              <img
                src="/Home.webp"
                alt="Home"
                className="h-[20px] w-[20px] object-contain shrink-0"
              />
            </div>
            <span
              className="text-[14.5px] font-[500] whitespace-nowrap transition-[opacity,max-width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-hidden"
              style={{ opacity: isCollapsed ? 0 : 1, maxWidth: isCollapsed ? 0 : 200 }}
            >
              Home
            </span>
          </Link>

          <div className="flex flex-col gap-[0.1px] w-full">
            {filteredNodes.map((def) => (
              <button
                key={def.type}
                draggable
                onDragStart={(e) => handleDragStart(e, def.type)}
                onDragEnd={() => setDraggingType(null)}
                onClick={() => handleClick(def.type)}
                title={isCollapsed ? def.label : undefined}
                className={cn(
                  'flex w-full items-center gap-1 rounded-xl px-1 py-2 transition-colors duration-200 hover:bg-[#111] cursor-grab active:cursor-grabbing',
                  draggingType === def.type && 'opacity-50',
                )}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-[6px] shrink-0">
                  {ICONS[def.type]}
                </div>
                <span
                  className="overflow-hidden whitespace-nowrap text-[14.5px] font-[500] text-[#f0f0f0] transition-[opacity,max-width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                  style={{ opacity: isCollapsed ? 0 : 1, maxWidth: isCollapsed ? 0 : 200 }}
                >
                  {def.label}
                </span>
              </button>
            ))}

            {!isCollapsed && filteredNodes.length === 0 && (
              <div className="px-2 py-4 text-[12px] text-[#666]">
                No nodes match &quot;{searchQuery}&quot;.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto px-3 pt-4 border-t border-[#1a1a1a]">
        <div className="relative flex items-center rounded-xl transition-colors px-1 py-2 gap-2">
          {isSignedIn ? (
            <div className="flex items-center rounded-full border border-white/10 bg-[#1a1a1a] px-1 py-1 shrink-0">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: 'h-7 w-7',
                  },
                }}
              />
            </div>
          ) : (
            <SignInButton mode="modal">
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#1a1a1a] text-[12px] font-[600] text-[#f0f0f0] transition-colors hover:bg-[#252525]"
                title="Sign in"
              >
                S
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </aside>
  );
}
