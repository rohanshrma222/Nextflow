import { task } from '@trigger.dev/sdk/v3';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';

interface LlmPayload {
  model: string;
  systemPrompt?: string;
  userMessage: string;
  images?: string[];
}

interface LlmResult {
  output: string;
}

function extractOutputText(response: {
  text: () => string;
  candidates?: Array<{
    finishReason?: string;
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  promptFeedback?: unknown;
}) {
  const directText = response.text().trim();

  if (directText) {
    return directText;
  }

  const candidateText = response.candidates?.[0]?.content?.parts
    ?.map((part) => part.text?.trim() ?? '')
    .filter(Boolean)
    .join('\n')
    .trim();

  if (candidateText) {
    return candidateText;
  }

  const finishReason = response.candidates?.[0]?.finishReason;
  const promptFeedback = response.promptFeedback
    ? ` promptFeedback=${JSON.stringify(response.promptFeedback)}`
    : '';

  throw new Error(
    `Gemini returned empty response${
      finishReason ? ` (finishReason: ${finishReason})` : ''
    }${promptFeedback}`,
  );
}

export const runLlmTask = task({
  id: 'run-llm',
  run: async (payload: LlmPayload): Promise<LlmResult> => {
    if (!process.env.GOOGLE_AI_API_KEY) {
      throw new Error('Missing GOOGLE_AI_API_KEY');
    }

    if (!payload.userMessage?.trim()) {
      throw new Error('userMessage is required');
    }

    console.log('LLM task started', {
      model: payload.model,
      hasSystemPrompt: Boolean(payload.systemPrompt),
      imageCount: payload.images?.length ?? 0,
    });

    // Init Gemini
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: payload.model ?? 'gemini-2.5-flash',
      ...(payload.systemPrompt?.trim()
        ? { systemInstruction: payload.systemPrompt }
        : {}),
    });

    // Build content parts — text first, then images
    const parts: Part[] = [{ text: payload.userMessage }];

    // Fetch each image URL and convert to base64 inlineData
    if (payload.images && payload.images.length > 0) {
      for (const imageUrl of payload.images.filter(Boolean)) {
        try {
          const response = await fetch(imageUrl);
          if (!response.ok) {
            console.warn(`Failed to fetch image: ${imageUrl}`);
            continue;
          }
          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          const mimeType = response.headers.get('content-type') ?? 'image/jpeg';

          parts.push({
            inlineData: {
              data: base64,
              mimeType,
            },
          });
        } catch (err) {
          console.warn(`Skipping image ${imageUrl}:`, err);
        }
      }
    }

    const result = await model.generateContent(parts);
    const output = extractOutputText(result.response);

    console.log('LLM task completed');
    return { output };
  },
});
