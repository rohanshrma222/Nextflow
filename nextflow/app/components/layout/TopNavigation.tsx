'use client';

import Link from 'next/link';
import { useRef, useTransition } from 'react';
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs';
import { useWorkflowStore } from '@/store/workflowStore';
import { ChevronLeft, Download, Moon, Save, Upload, Wand2 } from 'lucide-react';
import { saveWorkflow } from '@/actions/workflows';
import { showToast } from '@/lib/utils';
import type { WorkflowData } from '@/types';

export function TopNavigation({ workflowId }: { workflowId: string }) {
  const importRef = useRef<HTMLInputElement>(null);
  const { workflowName, setWorkflowName, nodes, edges, setNodes, setEdges } =
    useWorkflowStore();
  const { isSignedIn } = useAuth();
  const [isSaving, startSaving] = useTransition();

  function handleSave() {
    startSaving(async () => {
      const result = await saveWorkflow({
        id: workflowId,
        name: workflowName,
        nodes,
        edges,
      });

      if (result.success) {
        showToast('Workflow saved to database');
        return;
      }

      showToast(result.error || 'Failed to save workflow');
    });
  }

  function handleExport() {
    const data: WorkflowData = {
      name: workflowName,
      nodes,
      edges,
      meta: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `${(workflowName || 'workflow')
      .replace(/\s+/g, '-')
      .toLowerCase()}.json`;
    anchor.click();

    URL.revokeObjectURL(url);
    showToast('Workflow exported as JSON');
  }

  function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (loadEvent) => {
      try {
        const data = JSON.parse(
          loadEvent.target?.result as string,
        ) as WorkflowData;

        setNodes(data.nodes ?? []);
        setEdges(data.edges ?? []);

        if (data.name) {
          setWorkflowName(data.name);
        }

        showToast(`Imported ${data.name ?? 'workflow'}`);
      } catch {
        showToast('Invalid workflow JSON');
      }
    };

    reader.readAsText(file);
    event.target.value = '';
  }

  return (
    <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-50 pointer-events-none">
      <div
        className="pointer-events-auto flex items-center h-[48px] px-4 gap-4 rounded-[12px] shadow-sm outline outline-1 outline-[#262626]"
        style={{ background: '#202020' }}
      >
        <Link href="/nodes" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ChevronLeft size={14} color="#f0f0f0" strokeWidth={2} />
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <ellipse cx="11" cy="8.5" rx="5" ry="6" transform="rotate(-15 11 8.5)" fill="#f0f0f0" />
            <ellipse cx="10" cy="22" rx="4.5" ry="5.5" transform="rotate(10 10 22)" fill="#f0f0f0" />
            <ellipse cx="21.5" cy="14" rx="5.5" ry="6.5" transform="rotate(25 21.5 14)" fill="#f0f0f0" />
            <circle cx="14.5" cy="15" r="4" fill="#f0f0f0" />
          </svg>
        </Link>
        <span
          contentEditable
          suppressContentEditableWarning
          className="text-[14.5px] font-[500] text-[#f0f0f0] bg-transparent outline-none cursor-text hover:bg-white/5 py-[3px] rounded-[6px] tracking-[-0.01em] transition-colors"
          onBlur={(e) => setWorkflowName(e.currentTarget.textContent ?? workflowName)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
        >
          {workflowName || 'Untitled'}
        </span>
      </div>

      <div className="pointer-events-auto flex items-center gap-2">
        <button className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1a1a1a] hover:bg-[#252525] border border-white/5 text-[#a0a0a0] transition-colors">
          <Moon size={14} />
        </button>

        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-[#1a1a1a] hover:bg-[#252525] border border-white/5 text-[#a0a0a0] text-[12px] font-[500] transition-colors"
        >
          <Download size={13} />
          Export
        </button>

        <button
          type="button"
          onClick={() => importRef.current?.click()}
          className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-[#1a1a1a] hover:bg-[#252525] border border-white/5 text-[#a0a0a0] text-[12px] font-[500] transition-colors"
        >
          <Upload size={13} />
          Import
        </button>
        <input
          ref={importRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
        />

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-[#252525] hover:bg-[#333] border border-white/10 text-[#f0f0f0] text-[12px] font-[500] transition-colors disabled:opacity-50"
        >
          <Save size={13} />
          {isSaving ? 'Saving...' : 'Save'}
        </button>

        <button className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-[#1a1a1a] hover:bg-[#252525] border border-white/5 text-[#a0a0a0] text-[12px] font-[500] transition-colors">
          <Wand2 size={13} />
          Share
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

        <button
          onClick={useWorkflowStore.getState().toggleHistoryPanel}
          title="Toggle run history"
          className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1a1a1a] hover:bg-[#252525] border border-white/5 text-[#a0a0a0] transition-colors ml-1 leading-none font-bold"
        >
          ...
        </button>
      </div>
    </div>
  );
}
