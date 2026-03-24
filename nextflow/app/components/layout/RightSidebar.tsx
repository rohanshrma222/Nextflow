'use client';
import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  X,
  XCircle,
} from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import { formatDuration } from '@/lib/utils';
import type { NodeRunResult, WorkflowRun } from '@/types';

function NodeStatusIcon({ status }: { status: string }) {
  if (status === 'success') {
    return <CheckCircle2 size={12} className="text-[#4ade80]" />;
  }

  if (status === 'failed') {
    return <XCircle size={12} className="text-[#f87171]" />;
  }

  if (status === 'running') {
    return <Loader2 size={12} className="text-[#fbbf24] animate-spin" />;
  }

  return null;
}

function formatRunHeader(run: WorkflowRun) {
  return `Run #${run.id} · ${new Date(run.timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })} (${run.scopeLabel})`;
}

function formatNodeLabel(nodeResult: NodeRunResult) {
  return `${nodeResult.nodeName} · ${formatDuration(nodeResult.durationMs)}`;
}

function truncateValue(value: string, maxLength = 72) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
}

function NodeRunEntry({ nodeResult }: { nodeResult: NodeRunResult }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-[11px] text-[#d8d8d8]">
        <span className="text-[#6b6b6b]">├─</span>
        <span className="truncate">{formatNodeLabel(nodeResult)}</span>
        <NodeStatusIcon status={nodeResult.status} />
        {nodeResult.status === 'failed' && (
          <span className="text-[#f87171]">Failed</span>
        )}
      </div>

      {nodeResult.output && (
        <div
          className="pl-5 text-[10px] text-[#9b9b9b] break-words"
          title={nodeResult.output}
        >
          <span className="text-[#6b6b6b] mr-1">│</span>
          <span className="text-[#7a7a7a]">└─ Output:</span>{' '}
          {truncateValue(nodeResult.output)}
        </div>
      )}

      {nodeResult.error && (
        <div
          className="pl-5 text-[10px] text-[#f87171] break-words"
          title={nodeResult.error}
        >
          <span className="text-[#6b6b6b] mr-1">│</span>
          <span>└─ Error: {truncateValue(nodeResult.error)}</span>
        </div>
      )}
    </div>
  );
}

export function RightSidebar() {
  const { runs, historyPanelOpen, loadRuns, toggleHistoryPanel } = useWorkflowStore();
  const [expandedRun, setExpandedRun] = useState<number | null>(null);

  useEffect(() => {
    if (historyPanelOpen) {
      void loadRuns();
    }
  }, [historyPanelOpen, loadRuns]);

  if (!historyPanelOpen) {
    return null;
  }

  return (
    <aside
      className="absolute top-0 right-0 h-full border-l border-white/5 z-40 flex flex-col"
      style={{ width: 340, background: '#0a0a0a' }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#111]">
        <h2 className="text-[14px] font-[600] text-[#f0f0f0]">
          Workflow History
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-[500] px-2 py-0.5 rounded bg-white/5 text-[#a0a0a0]">
            {runs.length} runs
          </span>
          <button
            type="button"
            onClick={toggleHistoryPanel}
            title="Close version history"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/5 bg-[#1a1a1a] text-[#a0a0a0] transition-colors hover:bg-[#252525] hover:text-white"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {runs.length === 0 && (
          <div className="py-8 text-[12px] text-[#666]">
            No runs recorded yet.
          </div>
        )}

        <div className="flex flex-col gap-5">
          {runs.map((run) => {
            const isExpanded = expandedRun === run.id;

            return (
              <div key={run.id} className="border-b border-white/5 pb-4 last:border-b-0">
                <button
                  type="button"
                  className="w-full flex items-start gap-2 text-left hover:opacity-90 transition-opacity"
                  onClick={() => setExpandedRun(isExpanded ? null : run.id)}
                >
                  <span className="mt-[2px] text-[#777]">
                    {isExpanded ? (
                      <ChevronDown size={13} />
                    ) : (
                      <ChevronRight size={13} />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[12px] font-[500] text-[#f0f0f0] leading-[1.5]">
                      {formatRunHeader(run)}
                    </div>
                    <div className="mt-1 text-[10px] text-[#707070]">
                      {run.nodeResults.length} node
                      {run.nodeResults.length === 1 ? '' : 's'} ·{' '}
                      {formatDuration(run.durationMs)}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-3 flex flex-col gap-3 pl-2">
                    {run.nodeResults.map((nodeResult, index) => (
                      <NodeRunEntry
                        key={`${run.id}-${nodeResult.nodeId}-${index}`}
                        nodeResult={nodeResult}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
