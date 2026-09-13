import { streamText, convertToModelMessages } from 'ai';
import type { ChatRequestBody } from '@/lib/types';
import { buildSystemPrompt, getMode } from '@/lib/modes';
import { getModelForMode } from '@/lib/ai';
import { verifyIdToken } from '@/lib/verify-id-token';

export const maxDuration = 300;

export async function POST(req: Request) {
  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const isAuthed = await verifyIdToken(body.idToken, body.userId);
  if (!isAuthed) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const mode = getMode(body.mode);
  const system = buildSystemPrompt(mode, body.docText);

  try {
    const result = streamText({
      model: getModelForMode(mode),
      system,
      messages: await convertToModelMessages(
        body.messages as Parameters<typeof convertToModelMessages>[0],
      ),
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error('[/api/chat] generation failed:', err);
    return Response.json(
      { error: 'Model unavailable. Check GEMINI_API_KEY.' },
      { status: 500 },
    );
  }
}