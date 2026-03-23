import { NextResponse } from 'next/server';
import { tasks } from '@trigger.dev/sdk/v3';

interface TriggerBody {
  taskId: 'crop-image' | 'extract-frame';
  payload: Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<TriggerBody>;

    if (!body.taskId || !body.payload) {
      return NextResponse.json(
        { error: 'taskId and payload are required.' },
        { status: 400 },
      );
    }

    const handle = await tasks.trigger(body.taskId, body.payload);

    return NextResponse.json({ runId: handle.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to trigger task';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
