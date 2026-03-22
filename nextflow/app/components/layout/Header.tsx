'use client';
import { useRef } from 'react';
import { Play, Save, Download, Upload, Undo2, Redo2, Layers } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import { Button } from '../ui/Button';
import { showToast } from '@/lib/utils';
import type { WorkflowData } from '@/types';

interface HeaderProps {
  onRunAll: () => void;
  isRunning: boolean;
}

export function Header({ onRunAll, isRunning }: HeaderProps) {
  const importRef = useRef<HTMLInputElement>(null);
  const {
    workflowName, setWorkflowName,
    nodes, edges, setNodes, setEdges,
    undo, redo, past, future,
  } = useWorkflowStore();

  function handleExport() {
    const data: WorkflowData = {
      name: workflowName,
      nodes,
      edges,
      meta: { exportedAt: new Date().toISOString(), version: '1.0' },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Workflow exported as JSON');
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as WorkflowData;
        setNodes(data.nodes ?? []);
        setEdges(data.edges ?? []);
        if (data.name) setWorkflowName(data.name);
        showToast(`✅ Imported: ${data.name ?? 'workflow'}`);
      } catch {
        showToast('⚠ Invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 flex items-center gap-3 px-4 border-b z-50"
      style={{ height: 48, background: 'rgba(17,17,17,0.95)', borderColor: 'var(--border)', backdropFilter: 'blur(8px)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center bg-[#7c4dff]">
          <Layers size={13} color="white" />
        </div>
        <span className="text-[15px] font-[600] tracking-[-0.3px] text-[#f0f0f0]">NextFlow</span>
      </div>

      <div className="w-px h-5 bg-[rgba(255,255,255,0.1)] mx-1 flex-shrink-0" />

      {/* Workflow name */}
      <span
        contentEditable
        suppressContentEditableWarning
        className="text-[13px] text-[#a0a0a0] px-1.5 py-0.5 rounded-[5px] hover:bg-[#222] hover:text-[#f0f0f0] cursor-text transition-colors outline-none min-w-[40px]"
        onBlur={(e) => setWorkflowName(e.currentTarget.textContent ?? workflowName)}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      >
        {workflowName}
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <Button
          variant="ghost" size="sm"
          icon={<Undo2 size={12} />}
          onClick={undo}
          disabled={past.length === 0}
          title="Undo (Ctrl+Z)"
        >
          Undo
        </Button>
        <Button
          variant="ghost" size="sm"
          icon={<Redo2 size={12} />}
          onClick={redo}
          disabled={future.length === 0}
          title="Redo (Ctrl+Y)"
        >
          Redo
        </Button>

        <div className="w-px h-5 bg-[rgba(255,255,255,0.1)] mx-0.5" />

        {/* Export */}
        <Button variant="ghost" size="sm" icon={<Download size={12} />} onClick={handleExport}>
          Export
        </Button>

        {/* Import */}
        <Button variant="ghost" size="sm" icon={<Upload size={12} />} onClick={() => importRef.current?.click()}>
          Import
        </Button>
        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

        <div className="w-px h-5 bg-[rgba(255,255,255,0.1)] mx-0.5" />

        {/* Run workflow */}
        <Button
          variant="run"
          size="sm"
          loading={isRunning}
          icon={<Play size={12} />}
          onClick={onRunAll}
        >
          {isRunning ? 'Running…' : 'Run Workflow'}
        </Button>

        {/* Save */}
        <Button
          variant="primary"
          size="sm"
          icon={<Save size={12} />}
          onClick={() => showToast('✅ Saved (wire to DB to persist)')}
        >
          Save
        </Button>

        <div className="w-px h-5 bg-[rgba(255,255,255,0.1)] mx-0.5" />

        {/* Avatar */}
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-[600] text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #7c4dff, #e040fb)' }}>
          NF
        </div>
      </div>
    </header>
  );
}
