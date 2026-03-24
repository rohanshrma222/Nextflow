'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useWorkflowStore } from '@/store/workflowStore';
import { ChevronDown, ChevronUp, Download, Save, Upload } from 'lucide-react';
import { saveWorkflow } from '@/actions/workflows';
import { showToast } from '@/lib/utils';
import { cn } from '@/lib/cn';
import type { WorkflowData } from '@/types';

export function TopNavigation({ workflowId }: { workflowId: string }) {
  const importRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { workflowName, setWorkflowName, nodes, edges, setNodes, setEdges, historyPanelOpen } =
    useWorkflowStore();
  const [isSaving, startSaving] = useTransition();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  return (
    <div
      className="absolute top-4 left-[18px] flex justify-between items-start z-50 pointer-events-none transition-[right] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
      style={{ right: historyPanelOpen ? 356 : 16 }}
    >
      {/* Unified Logo and Title Container */}
      <div
        className="pointer-events-auto flex items-center h-[50px] px-2 gap-2 rounded-[12px] shadow-sm outline outline-1 outline-[#262626] transition-all duration-300 w-auto"
        style={{ background: '#202020' }}
      >
        <button
          type="button"
          className="flex items-center gap-1.3 hover:bg-white/10 px-2 py-[4px] rounded-[8px] transition-colors focus:outline-none shrink-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/MainLogo.png" alt="Logo" width={24} height={24} className="shrink-0 object-contain" />
          <ChevronDown size={14} color="#f0f0f0" strokeWidth={2.5} className="mt-[2px] opacity-80" />
        </button>

        <span
          contentEditable="plaintext-only"
          suppressContentEditableWarning
          className="text-[14.5px] font-[500] text-[#f0f0f0] bg-transparent outline-none cursor-text px-2 py-[4px] ml-[-10px] rounded-[7px] tracking-[-0.01em] transition-all duration-300 hover:bg-white/10 focus:bg-white/10 focus:ring-1 focus:ring-[#333] min-w-[30px] max-w-[400px] whitespace-nowrap overflow-hidden inline-block"
          onBlur={(e) => setWorkflowName(e.currentTarget.textContent?.trim() || 'Untitled')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
        >
          {workflowName || 'Untitled'}
        </span>
      </div>

      <div className="pointer-events-auto flex items-center gap-2">
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

        <div ref={menuRef} className="relative ml-1">
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            title="Open menu"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1a1a1a] hover:bg-[#252525] border border-white/5 text-[#a0a0a0] transition-colors"
          >
            <ChevronUp
              size={14}
              className={cn('transition-transform duration-200', isMenuOpen && 'rotate-180')}
            />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] min-w-[160px] rounded-xl border border-white/10 bg-[#111] p-1 shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
              <button
                type="button"
                onClick={() => {
                  useWorkflowStore.getState().toggleHistoryPanel();
                  setIsMenuOpen(false);
                }}
                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-[13px] font-[500] text-[#d8d8d8] transition-colors hover:bg-white/5"
              >
                Version history
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
