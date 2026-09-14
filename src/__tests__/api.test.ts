import { describe, it, expect, vi, beforeEach } from 'vitest';

// Tests for the verify-id-token module (pure server-side logic)
import { verifyIdToken } from '@/lib/verify-id-token';

describe('verifyIdToken', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('returns true when FIREBASE_WEB_API_KEY is not set', async () => {
    delete process.env.FIREBASE_WEB_API_KEY;
    const result = await verifyIdToken('token', 'uid');
    expect(result).toBe(true);
  });

  it('returns false when idToken is missing', async () => {
    process.env.FIREBASE_WEB_API_KEY = 'test-key';
    const result = await verifyIdToken(undefined, 'uid');
    expect(result).toBe(false);
  });

  it('returns false when expectedUid is missing', async () => {
    process.env.FIREBASE_WEB_API_KEY = 'test-key';
    const result = await verifyIdToken('token', undefined);
    expect(result).toBe(false);
  });

  it('returns false on fetch failure', async () => {
    process.env.FIREBASE_WEB_API_KEY = 'test-key';
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
    const result = await verifyIdToken('token', 'uid');
    expect(result).toBe(false);
  });

  it('returns false when API returns non-ok', async () => {
    process.env.FIREBASE_WEB_API_KEY = 'test-key';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response);
    const result = await verifyIdToken('token', 'uid');
    expect(result).toBe(false);
  });

  it('returns true when uid matches', async () => {
    process.env.FIREBASE_WEB_API_KEY = 'test-key';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ users: [{ localId: 'user-123' }] }),
    } as Response);
    const result = await verifyIdToken('token', 'user-123');
    expect(result).toBe(true);
  });

  it('returns false when uid does not match', async () => {
    process.env.FIREBASE_WEB_API_KEY = 'test-key';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ users: [{ localId: 'user-123' }] }),
    } as Response);
    const result = await verifyIdToken('token', 'user-456');
    expect(result).toBe(false);
  });
});
