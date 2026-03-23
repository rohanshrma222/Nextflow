import { auth } from '@clerk/nextjs/server';
import { listWorkflows } from '@/actions/workflows';
import { WorkflowLibrary } from '@/components/library/WorkflowLibrary';

export default async function NodesPage() {
  await auth.protect();
  const workflows = await listWorkflows();

  return <WorkflowLibrary workflows={workflows} />;
}
