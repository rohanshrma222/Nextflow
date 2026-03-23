import { NextResponse } from 'next/server';
import { tasks } from '@trigger.dev/sdk/v3';
import { z } from 'zod';

const triggerBodySchema = z.object({
  taskId: z.enum(['crop-image', 'extract-frame', 'run-llm']),
  payload: z.record(z.string(), z.unknown()),
});

export async function POST(request: Request) {
  try {
    let rawBody: unknown;

    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body.' },
        { status: 400 },
      );
    }

    const parsedBody = triggerBodySchema.safeParse(rawBody);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.issues[0]?.message || 'Invalid request body.' },
        { status: 400 },
      );
    }

    const handle = await tasks.trigger(
      parsedBody.data.taskId,
      parsedBody.data.payload,
    );

    return NextResponse.json({ runId: handle.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to trigger task';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
