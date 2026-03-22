'use client';

import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs';
import { useWorkflowStore } from '@/store/workflowStore';
import { ChevronDown, Moon, Wand2 } from 'lucide-react';

export function TopNavigation() {
  const { workflowName, setWorkflowName } = useWorkflowStore();
  const { isSignedIn } = useAuth();

  return (
    <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-50 pointer-events-none">
      {/* Left panel */}
      <div 
        className="pointer-events-auto flex items-center h-[48px] px-4 gap-4 rounded-[12px] shadow-sm outline outline-1 outline-[#262626]"
        style={{ background: '#202020' }}
      >
        <button className="flex items-center gap-1  hover:opacity-80 transition-opacity">
          {/* Krea-style 3-petal clover logo */}
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            {/* Top-left petal */}
            <ellipse cx="11" cy="8.5" rx="5" ry="6" transform="rotate(-15 11 8.5)" fill="#f0f0f0"/>
            {/* Bottom-left petal */}
            <ellipse cx="10" cy="22" rx="4.5" ry="5.5" transform="rotate(10 10 22)" fill="#f0f0f0"/>
            {/* Right petal */}
            <ellipse cx="21.5" cy="14" rx="5.5" ry="6.5" transform="rotate(25 21.5 14)" fill="#f0f0f0"/>
            {/* Center connector blob */}
            <circle cx="14.5" cy="15" r="4" fill="#f0f0f0"/>
          </svg>
          <ChevronDown size={14} color="#ffffffff" strokeWidth={2} />
        </button>
        <span
          contentEditable
          suppressContentEditableWarning
          className="text-[14.5px] font-[500] text-[#f0f0f0] bg-transparent outline-none cursor-text hover:bg-white/5 py-[3px] rounded-[6px] tracking-[-0.01em] transition-colors"
          onBlur={(e) => setWorkflowName(e.currentTarget.textContent ?? workflowName)}
          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        >
          {workflowName || 'Untitled'}
        </span>
      </div>

      {/* Right panel */}
      <div className="pointer-events-auto flex items-center gap-2">
        {/* Moon Button */}
        <button className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1a1a1a] hover:bg-[#252525] border border-white/5 text-[#a0a0a0] transition-colors">
          <Moon size={14} />
        </button>
        
        {/* Share Button */}
        <button className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-[#1a1a1a] hover:bg-[#252525] border border-white/5 text-[#a0a0a0] text-[12px] font-[500] transition-colors">
          <Wand2 size={13} />
          Share
        </button>

        {/* Turn workflow into app */}
        <button className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-[#252525] hover:bg-[#333] border border-white/10 text-[#f0f0f0] text-[12px] font-[500] transition-colors">
          <Wand2 size={13} />
          Turn workflow into app
        </button>

        {!isSignedIn && (
          <>
            <SignInButton mode="modal">
              <button type="button" className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-[#1a1a1a] hover:bg-[#252525] border border-white/5 text-[#f0f0f0] text-[12px] font-[500] transition-colors">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button type="button" className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-[#f0f0f0] hover:bg-white border border-white/10 text-[#0a0a0a] text-[12px] font-[600] transition-colors">
                Create account
              </button>
            </SignUpButton>
          </>
        )}

        {isSignedIn && (
          <div className="flex items-center rounded-full border border-white/10 bg-[#1a1a1a] px-1 py-1">
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: 'h-7 w-7',
                },
              }}
            />
          </div>
        )}

        {/* History / More button */}
        <button 
          onClick={useWorkflowStore.getState().toggleHistoryPanel}
          title="Toggle run history"
          className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1a1a1a] hover:bg-[#252525] border border-white/5 text-[#a0a0a0] transition-colors ml-1 leading-none -tracking-[2px] font-bold"
        >
          •••
        </button>
      </div>
    </div>
  );
}
