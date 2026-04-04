'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import {
  CopyPlus,
  FolderKanban,
  Grid2x2,
  ImageIcon,
  MoreHorizontal,
  MonitorPlay,
  Plus,
  Video,
} from 'lucide-react';

import {
  createSampleWorkflow,
  createWorkflow,
  type SavedWorkflowData,
} from '@/actions/workflows';
import { LeftSidebar } from '@/components/layout/LeftSidebar';

function formatUpdatedAt(date: Date) {
  return new Date(date).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function WorkflowLibrary({
  workflows,
}: {
  workflows: SavedWorkflowData[];
}) {
  const router = useRouter();
  const [isCreating, startCreating] = useTransition();
  const [isCreatingSample, startCreatingSample] = useTransition();

  function handleCreateWorkflow() {
    startCreating(async () => {
      const result = await createWorkflow('Untitled');

      if (result.success && result.id) {
        router.push(`/nodes/${result.id}?new=1`);
      }
    });
  }

  function handleCreateSampleWorkflow() {
    startCreatingSample(async () => {
      const result = await createSampleWorkflow();

      if (result.success && result.id) {
        router.push(`/nodes/${result.id}?sample=1`);
      }
    });
  }

  return (
    <div className="h-screen bg-[#0c0c0c] text-[#f0f0f0]">
      <div className="flex h-full">
        <LeftSidebar />

        <main className="flex-1 overflow-y-auto">
          <section className="relative h-[400px] overflow-hidden border-b border-white/5">
            <img
              src="/img.png"
              alt="Workflow library hero"
              className="absolute inset-0 h-full w-full object-cover object-center scale-110"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.42)_0%,rgba(0,0,0,0.18)_42%,rgba(0,0,0,0.22)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_38%)]" />
            <div className="relative z-10 mx-auto flex h-full max-w-[980px] flex-col justify-center px-10">
              <div className="max-w-[540px] ml-[-100px]">
                <div className="flex items-center gap-2">
                  <img
                    src="/NodeEditor.webp"
                    alt="Node Editor"
                    className="h-9 w-9 rounded-xl object-cover shadow-[0_16px_40px_rgba(12,109,255,0.28)]"
                  />
                  <h1 className="text-[30px] font-[400] tracking-[-0.04em] text-white drop-shadow-[0_10px_28px_rgba(0,0,0,0.28)]">
                    Node Editor
                  </h1>
                </div>
                <p className="mt-5 max-w-[520px] text-[17px] font-[600] leading-[1.55] text-white/95 drop-shadow-[0_8px_24px_rgba(0,0,0,0.22)]">
                  Nodes is the most powerful way to operate Nextflow. Connect every
                  tool and model into complex automated pipelines.
                </p>
                <button
                  type="button"
                  onClick={handleCreateWorkflow}
                  className="mt-15 inline-flex items-center gap-3 rounded-full bg-white px-10 py-2 text-[15px] font-[400] text-[#0b0b0b] shadow-[0_20px_50px_rgba(0,0,0,0.18)] transition-transform hover:scale-[1.01]"
                >
                  {isCreating ? 'Creating...' : 'New Workflow'}
                  <span aria-hidden className="text-[14px] leading-none">
                    {'->'}
                  </span>
                </button>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-[980px] px-10 py-14 mr-[250px]">
            <div className="border-b border-white/10 pb-4">
              <div className="flex gap-12 text-[17px] text-white">
                <button className="rounded-2xl bg-white/8 px-6 py-3 font-[500]">
                  Projects
                </button>
                <button className="py-3 text-[#d0d0d0]">Apps</button>
                <button className="py-3 text-[#d0d0d0]">Examples</button>
                <button className="py-3 text-[#d0d0d0]">Templates</button>
              </div>
            </div>

            {workflows.length === 0 ? (
              <div className="flex flex-col items-center py-24 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#2c9bff,#0f67ff)] shadow-[0_12px_40px_rgba(13,104,255,0.28)]">
                  <Grid2x2 size={24} />
                </div>
                <h2 className="mt-6 text-[40px] font-[600] tracking-[-0.02em] text-white">
                  No Workflows Yet
                </h2>
                <p className="mt-3 max-w-[420px] text-[24px] leading-[1.5] text-[#a6a6a6]">
                  You haven&apos;t created any workflows yet. Get started by creating
                  your first one.
                </p>
                <button
                  type="button"
                  onClick={handleCreateWorkflow}
                  className="mt-10 rounded-full bg-white px-10 py-4 text-[18px] font-[600] text-black"
                >
                  {isCreating ? 'Creating...' : 'New Workflow'}
                </button>
                <button
                  type="button"
                  onClick={handleCreateSampleWorkflow}
                  className="mt-4 rounded-full border border-white/10 bg-white/5 px-10 py-4 text-[18px] font-[600] text-white"
                >
                  {isCreatingSample ? 'Loading Sample...' : 'Load Sample Workflow'}
                </button>
                <button className="mt-8 text-[16px] text-[#a0a0a0]">
                  Learn More {'->'}
                </button>
              </div>
            ) : (
              <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                <button
                  type="button"
                  onClick={handleCreateWorkflow}
                  className="flex min-h-[220px] flex-col justify-between rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-left transition-colors hover:bg-white/[0.05]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                    <Plus size={22} />
                  </div>
                  <div>
                    <div className="text-[22px] font-[600]">New workflow</div>
                    <div className="mt-2 text-[14px] text-[#a0a0a0]">
                      Create an empty node editor canvas
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleCreateSampleWorkflow}
                  className="flex min-h-[220px] flex-col justify-between rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,#19191d,#101014)] p-6 text-left transition-colors hover:bg-white/[0.05]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#7c4dff,#9b6dff)]">
                    <CopyPlus size={22} />
                  </div>
                  <div>
                    <div className="text-[22px] font-[600]">
                      {isCreatingSample ? 'Loading sample...' : 'Sample workflow'}
                    </div>
                    <div className="mt-2 text-[14px] text-[#a0a0a0]">
                      Pre-built graph demonstrating uploads, crop, frame extraction, and LLM flow
                    </div>
                  </div>
                </button>

                {workflows.map((workflow) => (
                  <Link
                    key={workflow.id}
                    href={`/nodes/${workflow.id}`}
                    className="group block rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,#181818,#111111)] p-6 transition-transform hover:-translate-y-[1px]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#2c9bff,#0f67ff)]">
                        <FolderKanban size={22} />
                      </div>
                      <button type="button" className="text-[#7a7a7a]">
                        <MoreHorizontal size={18} />
                      </button>
                    </div>

                    <div className="mt-14">
                      <div className="text-[22px] font-[600] tracking-[-0.02em] text-white group-hover:text-white">
                        {workflow.name}
                      </div>
                      <div className="mt-3 flex items-center gap-3 text-[13px] text-[#8a8a8a]">
                        <span>{workflow.nodes.length} nodes</span>
                        <span>•</span>
                        <span>{workflow.edges.length} edges</span>
                      </div>
                      <div className="mt-5 flex items-center gap-4 text-[12px] text-[#737373]">
                        <span className="inline-flex items-center gap-1.5">
                          <ImageIcon size={13} />
                          {workflow.nodes.filter((node) => node.type === 'image').length}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Video size={13} />
                          {workflow.nodes.filter((node) => node.type === 'video').length}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MonitorPlay size={13} />
                          {workflow.nodes.filter((node) => node.type === 'llm').length}
                        </span>
                      </div>
                      <div className="mt-6 text-[12px] uppercase tracking-[0.16em] text-[#666]">
                        Updated {formatUpdatedAt(workflow.updatedAt)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
