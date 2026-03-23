'use client';
import { useEffect } from 'react';
import type { Edge, Node } from 'reactflow';
import { ReactFlowProvider } from 'reactflow';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { LeftSidebar } from '@/components/layout/LeftSidebar';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { BottomToolbar } from '@/components/layout/BottomToolbar';
import { BottomLeftControls } from '@/components/layout/BottomLeftControls';
import { FlowCanvas } from '@/components/canvas/FlowCanvas';
import { useWorkflowStore } from '@/store/workflowStore';

interface WorkflowAppProps {
  workflowId: string;
  initialName: string;
  initialNodes: Node[];
  initialEdges: Edge[];
}

export default function WorkflowApp({
  workflowId,
  initialName,
  initialNodes,
  initialEdges,
}: WorkflowAppProps) {
  const { setNodes, setEdges, setWorkflowName } = useWorkflowStore();

  useEffect(() => {
    setWorkflowName(initialName);
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialEdges, initialName, initialNodes, setEdges, setNodes, setWorkflowName]);

  return (
    <ReactFlowProvider>
      <div className="flex w-full h-screen overflow-hidden bg-[#101010]">
        <LeftSidebar />
        <main className="flex-1 relative w-full h-full overflow-hidden">
          <TopNavigation workflowId={workflowId} />
          <FlowCanvas onRunningChange={() => {}} />
          <BottomToolbar />
          <BottomLeftControls />
          <RightSidebar />
        </main>
      </div>
    </ReactFlowProvider>
  );
}
