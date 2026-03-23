import { NextResponse } from 'next/server';
import { runs } from '@trigger.dev/sdk/v3';
import type { RunStatus } from '@/types';

function normalizeRunError(error: unknown): string | null {
  if (!error) {
    return null;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function mapRunStatus(status: string | undefined): RunStatus {
  if (status === 'COMPLETED') {
    return 'success';
  }

  if (
    status === 'FAILED' ||
    status === 'CRASHED' ||
    status === 'TIMED_OUT' ||
    status === 'CANCELED'
  ) {
    return 'failed';
  }

  return 'running';
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  try {
    const { runId } = await params;
    const run = await runs.retrieve(runId);

    return NextResponse.json({
      status: mapRunStatus(run.status),
      output: run.output ?? null,
      error: normalizeRunError(run.error),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve task status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
