import crypto from 'node:crypto';
import { NextResponse } from 'next/server';

interface SignatureRequestBody {
  templateId?: string;
}

export async function POST(request: Request) {
  try {
    let body: SignatureRequestBody;

    try {
      body = (await request.json()) as SignatureRequestBody;
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body.' },
        { status: 400 },
      );
    }

    if (!body.templateId) {
      return NextResponse.json(
        { error: 'templateId is required.' },
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
      template_id: body.templateId,
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
