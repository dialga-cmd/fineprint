import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  generateText: vi.fn(),
  getFastTitleModel: vi.fn(),
}));

vi.mock('@/lib/verify-id-token', () => ({
  verifyIdToken: mocks.verifyIdToken,
}));

vi.mock('ai', () => ({
  generateText: mocks.generateText,
}));

vi.mock('@/lib/ai', () => ({
  getFastTitleModel: mocks.getFastTitleModel,
}));

import { POST as titlePOST } from '@/app/api/title/route';

describe('POST /api/title', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for invalid JSON', async () => {
    const req = new Request('http://localhost/api/title', {
      method: 'POST',
      body: 'not-json',
    });
    const res = await titlePOST(req);
    expect(res.status).toBe(400);
  });

  it('returns 401 when auth fails', async () => {
    mocks.verifyIdToken.mockResolvedValue(false);
    const req = new Request('http://localhost/api/title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'hello', userId: 'u', idToken: 't' }),
    });
    const res = await titlePOST(req);
    expect(res.status).toBe(401);
  });

  it('returns 500 when generateText fails', async () => {
    mocks.verifyIdToken.mockResolvedValue(true);
    mocks.getFastTitleModel.mockReturnValue({});
    mocks.generateText.mockRejectedValue(new Error('oops'));
    const req = new Request('http://localhost/api/title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'hello', userId: 'u', idToken: 't' }),
    });
    const res = await titlePOST(req);
    expect(res.status).toBe(500);
  });

  it('returns generated title on success', async () => {
    mocks.verifyIdToken.mockResolvedValue(true);
    mocks.getFastTitleModel.mockReturnValue({});
    mocks.generateText.mockResolvedValue({ text: 'Understanding Your Lease' });
    const req = new Request('http://localhost/api/title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'I just signed a lease', userId: 'u', idToken: 't' }),
    });
    const res = await titlePOST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.title).toBe('Understanding Your Lease');
  });

  it('cleanup quotes and truncates title', async () => {
    mocks.verifyIdToken.mockResolvedValue(true);
    mocks.getFastTitleModel.mockReturnValue({});
    mocks.generateText.mockResolvedValue({ text: '"Renters Reminder" — check deadlines' });
    const req = new Request('http://localhost/api/title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'x', userId: 'u', idToken: 't' }),
    });
    const res = await titlePOST(req);
    const data = await res.json();
    expect(data.title).toBe('Renters Reminder — check deadlines');
  });

  it('handles empty response text', async () => {
    mocks.verifyIdToken.mockResolvedValue(true);
    mocks.getFastTitleModel.mockReturnValue({});
    mocks.generateText.mockResolvedValue({ text: '   ' });
    const req = new Request('http://localhost/api/title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'x', userId: 'u', idToken: 't' }),
    });
    const res = await titlePOST(req);
    const data = await res.json();
    expect(data.title).toBe('New chat');
  });
});