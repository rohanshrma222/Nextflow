'use client';
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Clock, Box, PlayCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import { cn } from '@/lib/cn';
import { formatDuration } from '@/lib/utils';
import { WorkflowRun } from '@/types';

function StatusIcon({ status, size = 14 }: { status: string; size?: number }) {
  if (status === 'success') return <CheckCircle2 size={size} className="text-[#4ade80]" />;
  if (status === 'failed') return <XCircle size={size} className="text-[#f87171]" />;
  if (status === 'running') return <Loader2 size={size} className="text-[#fbbf24] animate-spin" />;
  return <PlayCircle size={size} className="text-[#a0a0a0]" />;
}

export function RightSidebar() {
  const { runs, historyPanelOpen, loadRuns } = useWorkflowStore();
  const [expandedRun, setExpandedRun] = useState<number | null>(null);

  useEffect(() => {
    if (historyPanelOpen) loadRuns();
  }, [historyPanelOpen, loadRuns]);

  if (!historyPanelOpen) return null;

  return (
    <aside 
      className="absolute top-0 right-0 h-full border-l border-white/5 z-40 shadow-2xl flex flex-col"
      style={{ width: 340, background: '#0a0a0a' }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#111]">
        <h2 className="text-[14px] font-[600] text-[#f0f0f0]">Workflow History</h2>
        <span className="text-[11px] font-[500] px-2 py-0.5 rounded bg-white/5 text-[#a0a0a0]">
          {runs.length} runs
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {runs.map((run: WorkflowRun) => (
          <div 
            key={run.id}
            className="rounded-[10px] bg-[#141414] border border-white/5 overflow-hidden shadow-sm"
          >
            {/* Header / Summary */}
            <div 
              className="px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
            >
              <div className="mt-0.5">
                <StatusIcon status={run.status} size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-[500] text-[#f0f0f0] truncate pr-2">
                    {run.scopeLabel}
                  </span>
                  <span className="text-[11px] text-[#777] whitespace-nowrap">
                    {new Date(run.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-[#888] font-mono">
                  <span className="flex items-center gap-1"><Clock size={11} /> {formatDuration(run.durationMs)}</span>
                  <span className={cn("uppercase px-1.5 py-0.5 rounded-[4px] bg-white/5", run.scope === 'partial' && 'text-[#fbbf24]')}>
                    {run.scope}
                  </span>
                </div>
              </div>
              <button className="text-[#555] hover:text-[#f0f0f0] mt-1 transition-colors">
                {expandedRun === run.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            </div>

            {/* Expanded Node Details */}
            {expandedRun === run.id && (
              <div className="border-t border-white/5 bg-[#0f0f0f] px-4 py-3 flex flex-col gap-3">
                {run.nodeResults.map((nr, idx) => (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusIcon status={nr.status} size={12} />
                        <span className="text-[12px] font-[500] text-[#e0e0e0]">{nr.nodeName}</span>
                      </div>
                      <span className="text-[10px] text-[#666] font-mono">{formatDuration(nr.durationMs)}</span>
                    </div>
                    {nr.error && (
                      <div className="text-[11px] text-[#f87171] bg-[#f87171]/10 px-2 py-1.5 rounded-[6px] break-words ml-5">
                        {nr.error}
                      </div>
                    )}
                    {nr.output && (
                      <div className="text-[11px] text-[#9b6dff] bg-[#9b6dff]/10 px-2 py-1.5 rounded-[6px] break-words ml-5 truncate" title={nr.output}>
                        {nr.output.length > 60 ? nr.output.substring(0, 60) + '...' : nr.output}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {runs.length === 0 && (
          <div className="text-center py-10 text-[12px] text-[#666]">
            No runs recorded yet in PostgreSQL.
          </div>
        )}
      </div>
    </aside>
  );
}
