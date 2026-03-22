'use client';
import { ReactNode, useState, useRef, useEffect } from 'react';
import { MoreVertical, Play, Copy, Trash2 } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import { RunStatus } from '@/types';

interface NodeHeaderProps {
  nodeId: string;
  title: string;
  icon: ReactNode;
  iconBg: string;
  status?: RunStatus;
  onRun?: () => void;
}

export function NodeHeader({ nodeId, title, icon, iconBg, status, onRun }: NodeHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { deleteNode, duplicateNode } = useWorkflowStore();

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [menuOpen]);

  const dotClass: Partial<Record<RunStatus, string>> = {
    running: 'bg-[#9b6dff] blink',
    success: 'bg-[#4ade80]',
    failed:  'bg-[#f87171]',
  };

  return (
    <div
      className="flex items-center gap-2 px-3 pt-[10px] pb-[9px] border-b relative"
      style={{ borderColor: 'rgba(255,255,255,0.07)', cursor: 'move', userSelect: 'none' }}
    >
      {/* Type icon */}
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{ width: 22, height: 22, borderRadius: 5, background: iconBg }}
      >
        {icon}
      </div>

      {/* Title */}
      <span className="flex-1 text-[12px] font-[500] text-[#f0f0f0] leading-none truncate">
        {title}
      </span>

      {/* Status dot */}
      {status && status !== 'idle' && dotClass[status] && (
        <span className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${dotClass[status]}`} />
      )}

      {/* Menu trigger */}
      <div ref={menuRef} className="relative">
        <button
          className="flex items-center justify-center rounded transition-colors"
          style={{ width: 20, height: 20, background: 'transparent', border: 'none', color: '#505050', cursor: 'pointer' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#222'; (e.currentTarget as HTMLElement).style.color = '#a0a0a0'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#505050'; }}
          onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
        >
          <MoreVertical size={12} />
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-6 z-50 rounded-[9px] p-1"
            style={{
              minWidth: 148,
              background: '#1e1e1e',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            {onRun && (
              <MenuItem
                icon={<Play size={12} />}
                label="Run node"
                onClick={() => { setMenuOpen(false); onRun(); }}
              />
            )}
            <MenuItem
              icon={<Copy size={12} />}
              label="Duplicate"
              onClick={() => { setMenuOpen(false); duplicateNode(nodeId); }}
            />
            <div className="h-px my-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <MenuItem
              icon={<Trash2 size={12} />}
              label="Delete node"
              danger
              onClick={() => { setMenuOpen(false); deleteNode(nodeId); }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function MenuItem({
  icon, label, danger, onClick,
}: {
  icon: ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="w-full flex items-center gap-2 rounded-[6px] text-[12px] transition-colors"
      style={{
        padding: '7px 10px',
        background: 'transparent',
        border: 'none',
        color: danger ? '#f87171' : '#a0a0a0',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = danger ? 'rgba(248,113,113,0.1)' : '#2a2a2a';
        if (!danger) (e.currentTarget as HTMLElement).style.color = '#f0f0f0';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'transparent';
        (e.currentTarget as HTMLElement).style.color = danger ? '#f87171' : '#a0a0a0';
      }}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}
