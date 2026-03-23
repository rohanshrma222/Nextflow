import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const signatureRequestSchema = z.object({
  templateId: z.string().min(1, 'templateId is required.'),
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

    const parsedBody = signatureRequestSchema.safeParse(rawBody);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.issues[0]?.message || 'Invalid request body.' },
        { status: 400 },
      );
    }

    if (!process.env.TRANSLOADIT_KEY || !process.env.TRANSLOADIT_SECRET) {
      return NextResponse.json(
        {
          error:
            'Missing Transloadit environment variables. Set TRANSLOADIT_KEY and TRANSLOADIT_SECRET.',
        },
        { status: 500 },
      );
    }

    const params = {
      auth: {
        key: process.env.TRANSLOADIT_KEY,
        expires: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
      template_id: parsedBody.data.templateId,
    };

    const paramsStr = JSON.stringify(params);
    const sig =
      'sha384:' +
      crypto
        .createHmac('sha384', process.env.TRANSLOADIT_SECRET)
        .update(Buffer.from(paramsStr, 'utf-8'))
        .digest('hex');

    return NextResponse.json({ signature: sig, params: paramsStr });
  } catch {
    return NextResponse.json(
      { error: 'Unexpected error while generating Transloadit signature.' },
      { status: 500 },
    );
  }
}
