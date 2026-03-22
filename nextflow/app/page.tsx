import { auth } from '@clerk/nextjs/server';
import WorkflowApp from './WorkflowApp';

export default async function Page() {
  await auth.protect();
  return <WorkflowApp />;
}
