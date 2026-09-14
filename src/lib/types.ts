export type ModeId = 'summarize' | 'compare' | 'risk' | 'checklist' | 'ask';

export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode: ModeId;
  docName?: string;
  createdAt: number;
}

export interface ConversationMeta {
  id: string;
  title: string;
  mode: ModeId;
  docName?: string;
  hasDoc: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ConversationDetail extends ConversationMeta {
  docText?: string;
}

export interface ChatRequestBody {
  messages: unknown[];
  mode: ModeId;
  conversationId?: string;
  docText?: string;
  userId?: string;
  idToken?: string;
}