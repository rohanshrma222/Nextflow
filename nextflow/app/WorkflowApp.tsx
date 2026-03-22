'use client';
import { useState, useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { LeftSidebar } from '@/components/layout/LeftSidebar';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { BottomToolbar } from '@/components/layout/BottomToolbar';
import { BottomLeftControls } from '@/components/layout/BottomLeftControls';
import { FlowCanvas } from '@/components/canvas/FlowCanvas';
import { useWorkflowStore } from '@/store/workflowStore';

export default function WorkflowApp() {
  const [isRunning, setIsRunning] = useState(false);
  const { setNodes, setEdges } = useWorkflowStore();

  useEffect(() => {
    // Optional sample init 
  }, [setNodes, setEdges]); 

  return (
    <ReactFlowProvider>
      <div className="flex w-full h-screen overflow-hidden bg-[#101010]">
        <LeftSidebar />
        <main className="flex-1 relative w-full h-full overflow-hidden">
          <TopNavigation />
          <FlowCanvas onRunningChange={setIsRunning} />
          <BottomToolbar />
          <BottomLeftControls />
          <RightSidebar />
        </main>
      </div>
    </ReactFlowProvider>
  );
}
