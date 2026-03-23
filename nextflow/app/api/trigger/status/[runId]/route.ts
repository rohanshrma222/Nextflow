import { NextResponse } from 'next/server';
import { runs } from '@trigger.dev/sdk/v3';
import type { RunStatus } from '@/types';
import { z } from 'zod';

const runIdParamsSchema = z.object({
  runId: z.string().min(1, 'runId is required.'),
});

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
    const rawParams = await params;
    const parsedParams = runIdParamsSchema.safeParse(rawParams);

    if (!parsedParams.success) {
      return NextResponse.json(
        { error: parsedParams.error.issues[0]?.message || 'Invalid runId.' },
        { status: 400 },
      );
    }

    const run = await runs.retrieve(parsedParams.data.runId);

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
