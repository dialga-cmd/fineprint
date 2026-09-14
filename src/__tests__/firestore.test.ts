import { describe, it, expect, vi } from 'vitest';
import type { WriteBatch } from 'firebase/firestore';
import type { StoredMessage } from '@/lib/types';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  getApp: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    commit: vi.fn(),
  })),
  getFirestore: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({
  getApp: vi.fn(),
}));

import { saveMessages } from '@/lib/firestore';

describe('firestore', () => {
  describe('saveMessages', () => {
    it('calls batch.set for each message', async () => {
      const batch = {
        set: vi.fn(),
        delete: vi.fn(),
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      } as unknown as WriteBatch;
      const { writeBatch } = await import('firebase/firestore');
      vi.mocked(writeBatch).mockReturnValue(batch as WriteBatch);

      const messages: StoredMessage[] = [
        { id: 'msg1', role: 'user', content: 'hello', mode: 'ask', createdAt: Date.now() },
        { id: 'msg2', role: 'assistant', content: 'hi', mode: 'ask', createdAt: Date.now() },
      ];

      await saveMessages('conv1', messages);
      expect(batch.set).toHaveBeenCalledTimes(2);
      expect(batch.commit).toHaveBeenCalled();
    });
  });
});
