'use client';

import { Command, Redo2, Undo2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';

function ControlButton({
  icon: Icon,
  onClick,
  disabled,
  label,
}: {
  icon: LucideIcon,
  onClick: () => void,
  disabled: boolean,
  label: string,
}) {
  return (
    <div className="relative group flex justify-center">
      <button
        onClick={onClick}
        disabled={disabled}
        className="btm-ctrl-btn w-[38px] h-[38px] flex items-center justify-center rounded-[12px] border border-white/5 shadow-sm"
      >
        <Icon size={16} strokeWidth={2.75} />
      </button>

      <div className="absolute bottom-full mb-2 hidden group-hover:flex items-center gap-1.5 px-2 py-1.5 box-border bg-[#ffffff] rounded-[10px] shadow-lg whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
        <span className="text-[12px] font-[500] text-black tracking-[-0.01em]">
          {label}
        </span>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[5px] w-[10px] h-[10px] bg-[#ffffff] rotate-45 rounded-[2px]" />
      </div>
    </div>
  );
}

export function BottomLeftControls() {
  const { undo, redo, past, future } = useWorkflowStore();

  return (
    <div className="absolute bottom-4 left-4 z-[9999] flex flex-col gap-2 pointer-events-auto">
      <div className="flex flex-col gap-2">
        <ControlButton
          icon={Undo2}
          onClick={undo}
          disabled={past.length === 0}
          label="Undo"
        />
        <ControlButton
          icon={Redo2}
          onClick={redo}
          disabled={future.length === 0}
          label="Redo"
        />
      </div>
      <button className="btm-ctrl-shortcuts flex h-[38px] w-[38px] items-center justify-center rounded-[12px] border border-white/5 shadow-sm sm:h-[36px] sm:w-auto sm:justify-start sm:gap-2 sm:rounded-[11px] sm:px-3">
        <Command size={15} />
        <span className="hidden text-[13px] font-[500] sm:inline">Keyboard shortcuts</span>
      </button>
    </div>
  );
}
