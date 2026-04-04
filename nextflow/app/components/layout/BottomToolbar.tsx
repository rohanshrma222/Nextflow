'use client';

import { Plus, MousePointer2, Hand, Scissors, Workflow } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/cn';

export function BottomToolbar() {
  const [active, setActive] = useState('cursor');

  const tools = [
    { id: 'add', icon: <Plus size={20} /> },
    { id: 'cursor', icon: <MousePointer2 size={20} /> },
    { id: 'hand', icon: <Hand size={20} /> },
    { id: 'scissors', icon: <Scissors size={20} /> },
    { id: 'workflow', icon: <Workflow size={20} /> },
  ];

  return (
    <div className="absolute bottom-4 left-1/2 z-50 w-[calc(100%-24px)] max-w-max -translate-x-1/2 pointer-events-auto sm:bottom-6 sm:w-auto">
      <div 
        className="flex items-center justify-center gap-1 rounded-2xl p-1"
        style={{ background: '#1a1a1a', border: '2px solid rgba(255,255,255,0.08)' }}
      >
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 sm:h-11 sm:w-11',
              active === t.id 
                ? 'bg-[#333] text-white shadow-sm' 
                : 'text-white hover:bg-[#404040]'
            )}
          >
            {t.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
