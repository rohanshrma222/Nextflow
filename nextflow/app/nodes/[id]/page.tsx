import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import WorkflowApp from '@/WorkflowApp';
import { loadWorkflowById } from '@/actions/workflows';

export default async function WorkflowEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await auth.protect();
  const { id } = await params;
  const workflow = await loadWorkflowById(id);

  if (!workflow) {
    notFound();
  }

  return (
    <WorkflowApp
      workflowId={workflow.id}
      initialName={workflow.name}
      initialNodes={workflow.nodes}
      initialEdges={workflow.edges}
    />
  );
}
