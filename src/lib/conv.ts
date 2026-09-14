import type { UIMessage } from 'ai';
import type { StoredMessage } from './types';

export function uiText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

export function storedToUIMessage(m: StoredMessage): UIMessage {
  return {
    id: m.id,
    role: m.role,
    parts: m.content ? [{ type: 'text', text: m.content, state: 'done' }] : [],
    metadata: m.docName ? { docName: m.docName } : undefined,
  };
}

export function nowMs(): number {
  return Date.now();
}

export function heuristicTitle(text: string): string {
  const words = text.replace(/\s+/g, ' ').trim().split(' ').slice(0, 8).join(' ');
  return words.length ? words : 'New chat';
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}