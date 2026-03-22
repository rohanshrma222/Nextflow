'use client';
import { RunStatus } from '@/types';

const config: Record<RunStatus, { label: string; bg: string; color: string; dotClass: string }> = {
  idle:    { label: 'idle',    bg: 'rgba(80,80,80,0.1)',           color: '#505050',  dotClass: 'bg-[#505050]' },
  running: { label: 'running', bg: 'rgba(155,109,255,0.1)',        color: '#9b6dff',  dotClass: 'bg-[#9b6dff] blink' },
  success: { label: 'success', bg: 'rgba(74,222,128,0.1)',         color: '#4ade80',  dotClass: 'bg-[#4ade80]' },
  failed:  { label: 'failed',  bg: 'rgba(248,113,113,0.1)',        color: '#f87171',  dotClass: 'bg-[#f87171]' },
};

// Map string statuses like 'partial' → 'failed'
function resolveStatus(status: string): RunStatus {
  if (status === 'partial') return 'failed';
  return (status as RunStatus) ?? 'idle';
}

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'xs';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const resolved = resolveStatus(status);
  const c = config[resolved];
  const pad = size === 'xs' ? 'px-1.5 py-px' : 'px-2 py-0.5';
  const fs  = size === 'xs' ? 'text-[9px]' : 'text-[10px]';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-[500] ${pad} ${fs}`}
      style={{ background: c.bg, color: c.color }}
    >
      <span className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${c.dotClass}`} />
      {status}
    </span>
  );
}
