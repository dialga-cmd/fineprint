import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  streamText: vi.fn(),
  convertToModelMessages: vi.fn(),
  getMode: vi.fn(),
  buildSystemPrompt: vi.fn(),
  getModelForMode: vi.fn(),
}));

vi.mock('@/lib/verify-id-token', () => ({
  verifyIdToken: mocks.verifyIdToken,
}));

vi.mock('ai', () => ({
  streamText: mocks.streamText,
  convertToModelMessages: mocks.convertToModelMessages,
}));

vi.mock('@/lib/modes', () => ({
  getMode: mocks.getMode,
  buildSystemPrompt: mocks.buildSystemPrompt,
}));

vi.mock('@/lib/ai', () => ({
  getModelForMode: mocks.getModelForMode,
}));

import { POST as chatPOST } from '@/app/api/chat/route';

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for invalid JSON', async () => {
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: 'not-json',
    });
    const res = await chatPOST(req);
    expect(res.status).toBe(400);
  });

  it('returns 401 when auth fails', async () => {
    mocks.verifyIdToken.mockResolvedValue(false);
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: 'bad', userId: 'uid', mode: 'ask', messages: [] }),
    });
    const res = await chatPOST(req);
    expect(res.status).toBe(401);
  });

  it('returns 500 when streamText throws', async () => {
    mocks.verifyIdToken.mockResolvedValue(true);
    mocks.getMode.mockReturnValue({ id: 'ask', label: '', description: '', model: 'gemini', prompt: '' });
    mocks.buildSystemPrompt.mockReturnValue('system');
    mocks.convertToModelMessages.mockReturnValue([]);
    mocks.getModelForMode.mockReturnValue({});
    mocks.streamText.mockRejectedValue(new Error('model error'));
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: 'valid', userId: 'uid', mode: 'ask', messages: [] }),
    });
    const res = await chatPOST(req);
    expect(res.status).toBe(500);
  });

  it('returns stream response on success', async () => {
    mocks.verifyIdToken.mockResolvedValue(true);
    mocks.getMode.mockReturnValue({ id: 'ask', label: 'Ask', description: '', model: 'gemini', prompt: 'p' });
    mocks.buildSystemPrompt.mockReturnValue('system prompt');
    mocks.convertToModelMessages.mockReturnValue([
      { role: 'user', content: 'hello' },
    ]);
    mocks.getModelForMode.mockReturnValue({});
    mocks.streamText.mockReturnValue({
      toUIMessageStreamResponse: () => new Response('streamed', { status: 200 }),
    });
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: 'valid', userId: 'uid', mode: 'ask', messages: [{ id: 'm1', role: 'user', parts: [{ type: 'text', text: 'hello' }] }] }),
    });
    const res = await chatPOST(req);
    expect(res.status).toBe(200);
    expect(mocks.getMode).toHaveBeenCalledWith('ask');
    expect(mocks.buildSystemPrompt).toHaveBeenCalled();
  });
});