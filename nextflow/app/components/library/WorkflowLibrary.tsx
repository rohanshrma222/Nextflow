'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  ChevronDown,
  EyeOff,
  Grid2x2,
  MoreHorizontal,
  Plus,
  Search,
} from 'lucide-react';

import {
  createSampleWorkflow,
  createWorkflow,
  type SavedWorkflowData,
} from '@/actions/workflows';
import { LeftSidebar } from '@/components/layout/LeftSidebar';

function formatEditedAgo(date: Date) {
  const now = new Date();
  const updated = new Date(date);
  const diffDays = Math.max(
    0,
    Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24))
  );

  if (diffDays === 0) return 'Edited today';
  if (diffDays === 1) return 'Edited 1 day ago';
  return `Edited ${diffDays} days ago`;
}

export function WorkflowLibrary({
  workflows,
}: {
  workflows: SavedWorkflowData[];
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, startCreating] = useTransition();
  const [isCreatingSample, startCreatingSample] = useTransition();
  const filteredWorkflows = workflows.filter((workflow) =>
    workflow.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

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
              <div className="ml-[-100px] max-w-[540px]">
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

          <section className="mx-auto max-w-[1380px] px-10 py-9">
            <div className="border-b border-white/10 pb-4">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-10 text-[17px] text-white">
                  <button className="rounded-2xl bg-white/8 px-6 py-3 font-[500]">
                    Projects
                  </button>
                  <button className="py-3 text-white">Apps</button>
                  <button className="py-3 text-white">Examples</button>
                  <button className="py-3 text-white">Templates</button>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="flex h-11 min-w-[308px] items-center gap-3 rounded-[12px] border border-white/10 bg-white/[0.03] px-4 text-[#8f8f8f]">
                    <Search size={18} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search projects..."
                      className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-[#8f8f8f]"
                    />
                  </label>
                  <button className="flex h-11 items-center gap-7 rounded-[12px] border border-white/10 bg-white/[0.03] px-5 text-[15px] text-white">
                    <span>Last viewed</span>
                    <ChevronDown size={16} className="text-[#7d7d7d]" />
                  </button>
                  <button className="flex h-11 w-11 items-center justify-center rounded-[12px] border border-white/10 bg-white/[0.03] text-[#7d7d7d]">
                    <EyeOff size={18} />
                  </button>
                </div>
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
            ) : filteredWorkflows.length === 0 ? (
              <div className="flex flex-col items-center py-24 text-center">
                <div className="text-[28px] font-[600] tracking-[-0.02em] text-white">
                  No matching projects
                </div>
                <p className="mt-3 max-w-[420px] text-[16px] leading-[1.6] text-[#8f8f8f]">
                  No saved workflows match "{searchQuery}".
                </p>
              </div>
            ) : (
              <div className="mt-7 grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
                <button
                  type="button"
                  onClick={handleCreateWorkflow}
                  className="group text-left"
                >
                  <div className="flex aspect-[1.42/0.8] items-center justify-center rounded-[10px] border border-white/8 bg-[#262626] transition-colors group-hover:bg-[#2b2b2b]">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">
                      <Plus size={18} />
                    </div>
                  </div>
                  <div className="mt-2 text-[16px] font-[600] tracking-[-0.02em] text-white">
                    New Workflow
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleCreateSampleWorkflow}
                  className="group text-left"
                >
                  <div className="relative aspect-[1.42/0.8] overflow-hidden rounded-[10px] border border-white/8 bg-[#171717]">
                    <div className="absolute left-[23%] top-[10%] h-[24%] w-[18%] rounded-[2px] bg-[#4a4a4a]" />
                    <div className="absolute left-[20%] top-[43%] h-[21%] w-[18%] rounded-[2px] bg-[#4a4a4a]" />
                    <div className="absolute left-[58%] top-[8%] h-[58%] w-[19%] rounded-[2px] bg-[#4a4a4a]" />
                    <div className="absolute left-[38%] top-[48%] h-[2px] w-[23%] rounded-full bg-[#d7b31f]" />
                    <div className="absolute right-5 top-4 text-[#d7d7d7]">
                      <MoreHorizontal size={18} />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-[16px] font-[600] tracking-[-0.02em] text-white">
                      {isCreatingSample ? 'Loading sample...' : 'Untitled'}
                    </div>
                    <div className="mt-0.5 text-[13px] text-[#7e7e7e]">Edited 8 days ago</div>
                  </div>
                </button>

                {filteredWorkflows.map((workflow) => (
                  <Link key={workflow.id} href={`/nodes/${workflow.id}`} className="group block">
                    <div className="relative aspect-[1.42/0.8] overflow-hidden rounded-[10px] border border-white/8 bg-[#1b1b1b]">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_24%,rgba(255,255,255,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.08))]" />
                      <div className="absolute left-[14%] top-[18%] h-[22%] w-[20%] rounded-[3px] bg-[#4a4a4a]" />
                      <div className="absolute left-[14%] top-[50%] h-[18%] w-[20%] rounded-[3px] bg-[#4a4a4a]" />
                      <div className="absolute right-[16%] top-[9%] h-[62%] w-[18%] rounded-[3px] bg-[#4a4a4a]" />
                      <div className="absolute left-[34%] top-[54%] h-[2px] w-[28%] rounded-full bg-[#d7b31f]" />
                      <div className="absolute right-5 top-4 text-[#d7d7d7]">
                        <MoreHorizontal size={18} />
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="text-[16px] font-[600] tracking-[-0.02em] text-white">
                        {workflow.name}
                      </div>
                      <div className="mt-0.5 text-[13px] text-[#7e7e7e]">
                        {formatEditedAgo(workflow.updatedAt)}
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
