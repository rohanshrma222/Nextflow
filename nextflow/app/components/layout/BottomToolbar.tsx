'use client';

import { Plus, MousePointer2, Hand, Scissors, Link2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/cn';

export function BottomToolbar() {
  const [active, setActive] = useState('cursor');

  const tools = [
    { id: 'add', icon: <Plus size={16} /> },
    { id: 'cursor', icon: <MousePointer2 size={16} /> },
    { id: 'hand', icon: <Hand size={16} /> },
    { id: 'scissors', icon: <Scissors size={16} /> },
    { id: 'link', icon: <Link2 size={16} /> },
  ];

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
      <div 
        className="flex items-center gap-1 p-1 rounded-2xl"
        style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200",
              active === t.id 
                ? "bg-[#333] text-white shadow-sm" 
                : "text-[#a0a0a0] hover:bg-white/5 hover:text-white"
            )}
          >
            {t.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
