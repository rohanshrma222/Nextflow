'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useWorkflowStore } from '@/store/workflowStore';
import { ChevronDown, Download, Play, Save, Upload, ChevronLeft, ChevronRight, Users, User } from 'lucide-react';
import { saveWorkflow } from '@/actions/workflows';
import { showToast } from '@/lib/utils';
import { cn } from '@/lib/cn';
import type { WorkflowData } from '@/types';

export function TopNavigation({ workflowId }: { workflowId: string }) {
  const importRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const logoMenuRef = useRef<HTMLDivElement>(null);
  const { workflowName, setWorkflowName, nodes, edges, setNodes, setEdges, historyPanelOpen } =
    useWorkflowStore();
  const [isSaving, startSaving] = useTransition();
  const [isRunningWorkflow, startRunningWorkflow] = useTransition();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoMenuOpen, setIsLogoMenuOpen] = useState(false);
  const [isWorkspacesOpen, setIsWorkspacesOpen] = useState(false);

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

  function handleRunWorkflow() {
    startRunningWorkflow(async () => {
      const runner = (window as Window & { __nfRunAll?: () => void }).__nfRunAll;

      if (!runner) {
        showToast('Workflow runner is not ready');
        return;
      }

      runner();
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
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (!logoMenuRef.current?.contains(event.target as Node)) {
        setIsLogoMenuOpen(false);
        setIsWorkspacesOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside, { capture: true });
    document.addEventListener('touchstart', handleClickOutside, { capture: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, { capture: true });
      document.removeEventListener('touchstart', handleClickOutside, { capture: true });
    };
  }, []);

  return (
    <div
      className={cn(
        'absolute top-3 left-3 right-3 z-50 flex items-start justify-between gap-2 pointer-events-none transition-[right] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] sm:top-4 sm:left-4 sm:right-4 xl:left-[18px]',
        historyPanelOpen && 'xl:right-[356px]',
      )}
    >
      {/* Unified Logo and Title Container */}
      <div className="relative min-w-0 max-w-[calc(100%-148px)] sm:max-w-[calc(100%-180px)]" ref={logoMenuRef}>
        <div
          className="pointer-events-auto flex h-[50px] min-w-0 max-w-full items-center gap-1.5 rounded-[12px] px-2 shadow-sm outline outline-1 outline-[#262626] transition-all duration-300 sm:gap-2"
          style={{ background: '#202020' }}
        >
          <button
            type="button"
            onClick={() => setIsLogoMenuOpen(!isLogoMenuOpen)}
            className="flex shrink-0 items-center gap-1.3 rounded-[8px] px-2 py-[4px] transition-colors hover:bg-white/10 focus:outline-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/MainLogo.png" alt="Logo" width={24} height={24} className="shrink-0 object-contain" />
            <ChevronDown size={14} color="#f0f0f0" strokeWidth={2.5} className="mt-[2px] opacity-80" />
          </button>

          <span
            contentEditable="plaintext-only"
            suppressContentEditableWarning
            className="ml-[-10px] inline-block min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-[7px] bg-transparent px-2 py-[4px] text-[13.5px] font-[500] tracking-[-0.01em] text-[#f0f0f0] outline-none transition-all duration-300 hover:bg-white/10 focus:bg-white/10 focus:ring-1 focus:ring-[#333] sm:text-[14.5px]"
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

        {/* Logo Dropdown Menu */}
        {isLogoMenuOpen && (
          <>
            {/* Invisible Backdrop for bulletproof click-away */}
            <div
              className="fixed inset-0 z-[90] pointer-events-auto"
              onClick={() => {
                setIsLogoMenuOpen(false);
                setIsWorkspacesOpen(false);
              }}
            />

            <div className="animate-menu absolute top-[calc(100%+8px)] left-0 z-[100] flex w-[min(255px,calc(100vw-24px))] flex-col rounded-[14px] border border-[#2a2a2a] bg-[#202020] py-2 shadow-[0_12px_30px_rgba(0,0,0,0.6)] outline outline-1 outline-black/20 pointer-events-auto sm:w-[255px]">

              <Link href="/nodes" className="mx-1.5 flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-[13px] font-[500] text-[#eaeaea] transition-colors hover:bg-[#171717]">
                <ChevronLeft size={16} className="text-[#a0a0a0]" strokeWidth={2.5} />
                Back
              </Link>

              <div className="h-[12px]" />

              <button type="button" onClick={() => { importRef.current?.click(); setIsLogoMenuOpen(false); }} className="mx-1.5 flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-left text-[13px] font-[500] text-[#eaeaea] transition-colors hover:bg-[#171717]">
                <Upload size={16} className="text-[#a0a0a0]" />
                Import
              </button>

              <button type="button" onClick={() => { handleExport(); setIsLogoMenuOpen(false); }} className="mx-1.5 flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-left text-[13px] font-[500] text-[#eaeaea] transition-colors hover:bg-[#171717]">
                <Download size={16} className="text-[#a0a0a0]" />
                Export
              </button>

              <div
                className="relative mt-1"
                onMouseEnter={() => setIsWorkspacesOpen(true)}
                onMouseLeave={() => setIsWorkspacesOpen(false)}
              >
                <div className="mx-1.5 flex cursor-pointer items-center justify-between rounded-[8px] px-3 py-2.5 text-[13px] font-[500] text-[#eaeaea] transition-colors hover:bg-[#171717]">
                  <div className="flex items-center gap-3">
                    <Users size={16} className="text-[#a0a0a0]" />
                    Workspaces
                  </div>
                  <ChevronRight size={16} className="text-[#a0a0a0]" />
                </div>

                {isWorkspacesOpen && (
                  <div className="animate-menu absolute left-0 top-[calc(100%+8px)] z-[100] w-[min(260px,calc(100vw-24px))] overflow-hidden rounded-[14px] border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.6)] outline outline-1 outline-black/20 sm:w-[260px] xl:left-[calc(100%+8px)] xl:top-0">
                    <div className="px-3 pb-3 text-[12px] font-[600] tracking-wide text-[#888]">Workspaces</div>
                    <div className="flex cursor-pointer items-center gap-3 rounded-[8px] bg-[#171717] px-3 py-2.5 text-[13px] font-[500] text-[#eaeaea] transition-colors outline outline-1 outline-white/5">
                      <div className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[6px] border border-[#333] bg-[#1a1a1a]">
                        <User size={14} className="text-[#a0a0a0]" />
                      </div>
                      Default Workspace
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="pointer-events-auto flex shrink-0 items-center gap-2">
        <input
          ref={importRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
        />

        <button
          type="button"
          onClick={handleRunWorkflow}
          disabled={isRunningWorkflow}
          className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-white/10 bg-[#252525] text-[#f0f0f0] transition-colors hover:bg-[#333] disabled:opacity-50 sm:h-8 sm:w-auto sm:gap-1.5 sm:rounded-full sm:px-3"
        >
          <Play size={13} />
          <span className="hidden sm:inline">
            {isRunningWorkflow ? 'Running...' : 'Run Workflow'}
          </span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="hidden h-8 items-center gap-1.5 rounded-full border border-white/10 bg-[#252525] px-3 text-[12px] font-[500] text-[#f0f0f0] transition-colors hover:bg-[#333] disabled:opacity-50 sm:flex"
        >
          <Save size={13} />
          <span>{isSaving ? 'Saving...' : 'Save'}</span>
        </button>

        <div ref={menuRef} className="relative ml-1">
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            title="Open menu"
            className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-white/5 bg-[#1a1a1a] text-[#a0a0a0] transition-colors hover:bg-[#252525] sm:h-8 sm:w-8 sm:rounded-full"
          >
            <ChevronDown
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
