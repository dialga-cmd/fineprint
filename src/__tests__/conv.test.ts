import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { uiText, storedToUIMessage, nowMs, heuristicTitle, timeAgo } from '@/lib/conv';
import type { StoredMessage } from '@/lib/types';
import type { UIMessage } from 'ai';

describe('uiText', () => {
  it('extracts text from text parts', () => {
    const msg: UIMessage = {
      id: '1',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'Hello ' },
        { type: 'text', text: 'world' },
      ],
    };
    expect(uiText(msg)).toBe('Hello world');
  });

  it('ignores non-text parts', () => {
    const msg: UIMessage = {
      id: '1',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'visible' },
        // @ts-expect-error testing non-text part
        { type: 'tool-invocation', toolInvocation: {} },
      ],
    };
    expect(uiText(msg)).toBe('visible');
  });

  it('returns empty string for no text parts', () => {
    const msg: UIMessage = {
      id: '1',
      role: 'assistant',
      parts: [],
    };
    expect(uiText(msg)).toBe('');
  });
});

describe('storedToUIMessage', () => {
  it('converts a stored message to UI message', () => {
    const stored: StoredMessage = {
      id: 'abc',
      role: 'user',
      content: 'test message',
      mode: 'ask',
      createdAt: Date.now(),
    };
    const result = storedToUIMessage(stored);
    expect(result.id).toBe('abc');
    expect(result.role).toBe('user');
    expect(result.parts).toEqual([{ type: 'text', text: 'test message', state: 'done' }]);
  });

  it('includes docName in metadata when present', () => {
    const stored: StoredMessage = {
      id: 'abc',
      role: 'user',
      content: 'test',
      mode: 'ask',
      docName: 'contract.pdf',
      createdAt: Date.now(),
    };
    const result = storedToUIMessage(stored);
    expect(result.metadata).toEqual({ docName: 'contract.pdf' });
  });

  it('omits metadata when no docName', () => {
    const stored: StoredMessage = {
      id: 'abc',
      role: 'assistant',
      content: 'response',
      mode: 'summarize',
      createdAt: Date.now(),
    };
    const result = storedToUIMessage(stored);
    expect(result.metadata).toBeUndefined();
  });

  it('handles empty content', () => {
    const stored: StoredMessage = {
      id: 'abc',
      role: 'assistant',
      content: '',
      mode: 'ask',
      createdAt: Date.now(),
    };
    const result = storedToUIMessage(stored);
    expect(result.parts).toEqual([]);
  });
});

describe('nowMs', () => {
  it('returns a number close to Date.now()', () => {
    const before = Date.now();
    const result = nowMs();
    const after = Date.now();
    expect(result).toBeGreaterThanOrEqual(before);
    expect(result).toBeLessThanOrEqual(after);
  });
});

describe('heuristicTitle', () => {
  it('truncates to 8 words', () => {
    const text = 'one two three four five six seven eight nine ten';
    expect(heuristicTitle(text)).toBe('one two three four five six seven eight');
  });

  it('normalizes whitespace', () => {
    expect(heuristicTitle('  lots   of   spaces  ')).toBe('lots of spaces');
  });

  it('returns "New chat" for empty input', () => {
    expect(heuristicTitle('')).toBe('New chat');
    expect(heuristicTitle('   ')).toBe('New chat');
  });

  it('handles single word', () => {
    expect(heuristicTitle('hello')).toBe('hello');
  });
});

describe('timeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for less than 1 minute', () => {
    const ts = Date.now() - 30_000;
    expect(timeAgo(ts)).toBe('just now');
  });

  it('returns minutes ago', () => {
    const ts = Date.now() - 5 * 60_000;
    expect(timeAgo(ts)).toBe('5m ago');
  });

  it('returns hours ago', () => {
    const ts = Date.now() - 3 * 3600_000;
    expect(timeAgo(ts)).toBe('3h ago');
  });

  it('returns days ago', () => {
    const ts = Date.now() - 4 * 86_400_000;
    expect(timeAgo(ts)).toBe('4d ago');
  });

  it('returns weeks ago', () => {
    const ts = Date.now() - 2 * 7 * 86_400_000;
    expect(timeAgo(ts)).toBe('2w ago');
  });

  it('returns months ago', () => {
    const ts = Date.now() - 60 * 86_400_000;
    expect(timeAgo(ts)).toBe('2mo ago');
  });
});
