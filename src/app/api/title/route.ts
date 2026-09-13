import { generateText } from 'ai';
import { TITLE_PROMPT } from '@/lib/modes';
import { getFastTitleModel } from '@/lib/ai';
import { verifyIdToken } from '@/lib/verify-id-token';

export const maxDuration = 30;

interface TitleBody {
  topic: string;
  userId?: string;
  idToken?: string;
}

export async function POST(req: Request) {
  let body: TitleBody;
  try {
    body = (await req.json()) as TitleBody;
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const isAuthed = await verifyIdToken(body.idToken, body.userId);
  if (!isAuthed) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const topic = (body.topic ?? '').trim().slice(0, 1500);

  try {
    const { text } = await generateText({
      model: getFastTitleModel(),
      prompt: TITLE_PROMPT.replace('{topic}', topic),
      temperature: 0.7,
    });
    const title =
      text
        .trim()
        .replace(/["'„“”‘’…]/g, '')
        .split('\n')[0]
        .slice(0, 60) || 'New chat';
    return Response.json({ title });
  } catch (err) {
    console.error('[/api/title] failed:', err);
    return Response.json({ error: 'Title generation failed' }, { status: 500 });
  }
}