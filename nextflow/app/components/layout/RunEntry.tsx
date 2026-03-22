'use client';
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { WorkflowRun } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDuration, formatTimestamp } from '@/lib/utils';

interface RunEntryProps {
  run: WorkflowRun;
}

export function RunEntry({ run }: RunEntryProps) {
  const [expanded, setExpanded] = useState(false);

  const scopeColor: Record<string, string> = {
    full:    'var(--text)',
    partial: 'var(--text)',
    single:  'var(--text)',
  };

  return (
    <div
      className="border rounded-[9px] mb-1.5 overflow-hidden transition-colors cursor-pointer"
      style={{
        background: 'var(--bg3)',
        borderColor: expanded ? 'rgba(155,109,255,0.3)' : 'var(--border)',
      }}
    >
      {/* Header row */}
      <div
        className="flex items-start gap-2 px-3 py-[10px] hover:bg-[rgba(255,255,255,0.02)] transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <span className="text-[10px] text-[#505050] mt-0.5 flex-shrink-0" style={{ fontFamily: 'var(--mono)' }}>
          #{run.id}
        </span>

        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-[500] mb-1 truncate" style={{ color: scopeColor[run.scope] }}>
            {run.scopeLabel}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={run.status} size="xs" />
            <span className="text-[10px] text-[#505050]">{formatDuration(run.durationMs)}</span>
            <span className="text-[10px] text-[#505050]">·</span>
            <span className="text-[10px] text-[#505050]">{formatTimestamp(run.timestamp).split(', ').slice(-1)[0]}</span>
          </div>
        </div>

        <ChevronRight
          size={12}
          className="text-[#505050] mt-0.5 flex-shrink-0 transition-transform"
          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
        />
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t px-3 py-2" style={{ borderColor: 'var(--border)' }}>
          {run.nodeResults.map((result, i) => {
            const isLast = i === run.nodeResults.length - 1;
            const tree = isLast ? '└──' : '├──';
            const icon = result.status === 'success' ? '✅' : '❌';

            return (
              <div key={result.nodeId + i}>
                <div className="flex items-center gap-1.5 py-1">
                  <span className="text-[10px] text-[#505050] flex-shrink-0" style={{ fontFamily: 'var(--mono)' }}>
                    {tree}
                  </span>
                  <span className="text-[10.5px] text-[#a0a0a0] flex-1 truncate">{result.nodeName}</span>
                  <span className="text-[11px]">{icon}</span>
                  <span className="text-[10px] text-[#505050] flex-shrink-0" style={{ fontFamily: 'var(--mono)' }}>
                    {formatDuration(result.durationMs)}
                  </span>
                </div>
                {(result.output ?? result.error) && (
                  <div
                    className="pb-1 leading-[1.5] truncate text-[10px]"
                    style={{
                      paddingLeft: 26,
                      color: result.status === 'failed' ? '#f87171' : '#505050',
                      fontFamily: 'var(--mono)',
                    }}
                  >
                    {result.status === 'failed' ? '⚠ ' : '↳ '}
                    {result.error ?? result.output}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
