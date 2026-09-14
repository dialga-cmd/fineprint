'use client';

import { useCallback, useRef, useState } from 'react';
import * as fp from '@/lib/firestore';
import type { ConversationMeta } from '@/lib/types';

export interface UseConversationListResult {
  conversations: ConversationMeta[];
  setConversations: React.Dispatch<React.SetStateAction<ConversationMeta[]>>;
  loadConversations: (uid: string) => Promise<void>;
  removeConversation: (id: string) => void;
  addConversation: (meta: ConversationMeta) => void;
  updateConversationMeta: (id: string, updater: (c: ConversationMeta) => ConversationMeta) => void;
}

/**
 * Manages the sidebar conversation list state and Firestore sync.
 * Handles clearing on sign-out via handled in parent (ChatApp).
 */
export function useConversationList(): UseConversationListResult {
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const loadingRef = useRef<string | null>(null);

  const loadConversations = useCallback(async (uid: string) => {
    if (loadingRef.current === uid) return;
    loadingRef.current = uid;
    try {
      const convs = await fp.listConversations(uid);
      setConversations(convs);
    } finally {
      loadingRef.current = null;
    }
  }, []);

  const removeConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addConversation = useCallback((meta: ConversationMeta) => {
    setConversations((prev) => [meta, ...prev.filter((c) => c.id !== meta.id)]);
  }, []);

  const updateConversationMeta = useCallback(
    (id: string, updater: (c: ConversationMeta) => ConversationMeta) => {
      setConversations((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
    },
    [],
  );

  return {
    conversations,
    setConversations,
    loadConversations,
    removeConversation,
    addConversation,
    updateConversationMeta,
  };
}