'use client';

import { Undo2, Redo2, Command } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';

function ControlButton({ 
  icon: Icon, 
  onClick, 
  disabled, 
  label, 
  keys 
}: { 
  icon: any, 
  onClick: () => void, 
  disabled: boolean, 
  label: string, 
  keys: string[] 
}) {
  return (
    <div className="relative group flex justify-center">
      <button 
        onClick={onClick}
        disabled={disabled}
        className="w-[48px] h-[48px] flex items-center justify-center rounded-[16px] bg-[#202020] border border-white/5 hover:bg-white/20 hover:text-white text-[#777777] disabled:opacity-40 disabled:hover:bg-[#202020] disabled:hover:text-[#777777] transition-all duration-200 shadow-sm hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
      >
        {/* We use strokeWidth 3 for a bolder, richer look on hover like Image 2 */}
        <Icon size={21} strokeWidth={2.75} />
      </button>
      
      {/* Tooltip */}
      <div className="absolute bottom-full mb-3 hidden group-hover:flex items-center gap-2.5 px-3 py-2 box-border bg-[#ffffff] rounded-[14px] shadow-lg whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
        <span className="text-[17px] font-[500] text-black tracking-[-0.01em] pl-0.5">{label}</span>
        <div className="flex items-center gap-[5px]">
          {keys.map((k, i) => (
            <kbd key={i} className="flex items-center justify-center min-w-[26px] h-[26px] px-1.5 bg-[#f5f5f5] outline outline-1 outline-[#e0e0e0] rounded-[6px] text-[13px] font-[500] text-[#444] font-sans shadow-sm">
              {k === 'cmd' ? <Command size={13} strokeWidth={2.5} className="mt-px" /> : k === 'shift' ? '⇧' : k}
            </kbd>
          ))}
        </div>
        {/* Triangle caret */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[7px] w-[13px] h-[13px] bg-[#ffffff] rotate-45 rounded-[3px]" />
      </div>
    </div>
  );
}

export function BottomLeftControls() {
  const { undo, redo, past, future } = useWorkflowStore();

  return (
    <div className="absolute bottom-6 left-6 z-50 pointer-events-auto flex items-center gap-3">
      <ControlButton 
        icon={Undo2} 
        onClick={undo} 
        disabled={past.length === 0} 
        label="Undo" 
        keys={['cmd', 'Z']} 
      />
      <ControlButton 
        icon={Redo2} 
        onClick={redo} 
        disabled={future.length === 0} 
        label="Redo" 
        keys={['cmd', 'shift', 'Z']} 
      />

      <button className="h-[48px] px-4 flex items-center gap-2 rounded-[16px] bg-[#202020] border border-white/5 hover:bg-white/10 text-[#a0a0a0] hover:text-white transition-colors text-[13px] font-[500] shadow-sm ml-1">
        <Command size={15} />
        Keyboard shortcuts
      </button>
    </div>
  );
}
