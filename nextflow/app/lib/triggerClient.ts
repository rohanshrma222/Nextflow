type TriggerStatus = 'running' | 'success' | 'failed';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function triggerTask(
  taskId: string,
  payload: Record<string, unknown>,
): Promise<{ runId: string }> {
  const response = await fetch('/api/trigger', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ taskId, payload }),
  });

  const data = (await response.json()) as {
    runId?: string;
    error?: string;
  };

  if (!response.ok || !data.runId) {
    throw new Error(data.error || 'Failed to trigger task');
  }

  return { runId: data.runId };
}

async function pollTaskResult(
  runId: string,
  onStatusChange?: (status: TriggerStatus) => void,
  intervalMs = 2000,
  timeoutMs = 300000,
): Promise<Record<string, unknown>> {
  const startTime = Date.now();

  onStatusChange?.('running');

  for (;;) {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error('Task timed out');
    }

    const response = await fetch(`/api/trigger/status/${runId}`, {
      cache: 'no-store',
    });
    const data = (await response.json()) as {
      status?: TriggerStatus;
      output?: Record<string, unknown> | null;
      error?: string | null;
    };

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch task status');
    }

    if (data.status === 'success') {
      onStatusChange?.('success');
      return data.output ?? {};
    }

    if (data.status === 'failed') {
      onStatusChange?.('failed');
      throw new Error(data.error ?? 'Task failed');
    }

    await sleep(intervalMs);
  }
}

export { triggerTask, pollTaskResult };
