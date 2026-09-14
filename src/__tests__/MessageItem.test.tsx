import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageItem } from '@/components/MessageItem';
import type { UIMessage } from 'ai';

vi.mock('next/font/google', () => ({
  Fraunces: () => ({ variable: '--font-display', className: '' }),
  Instrument_Sans: () => ({ variable: '--font-sans', className: '' }),
  IBM_Plex_Mono: () => ({ variable: '--font-mono', className: '' }),
}));

function makeMessage(overrides: Partial<UIMessage> & { role: UIMessage['role'] }): UIMessage {
  return {
    id: 'test-id',
    parts: [{ type: 'text', text: 'test message' }],
    ...overrides,
  } as UIMessage;
}

describe('MessageItem', () => {
  it('renders user message with gold bubble', () => {
    const msg = makeMessage({ role: 'user' });
    render(<MessageItem message={msg} />);
    expect(screen.getByText('test message')).toBeInTheDocument();
  });

  it('renders assistant message with markdown', () => {
    const msg = makeMessage({ role: 'assistant', parts: [{ type: 'text', text: '**bold**' }] });
    render(<MessageItem message={msg} />);
    expect(screen.getByText('bold')).toBeInTheDocument();
  });

  it('shows mode tag for assistant messages', () => {
    const msg = makeMessage({ role: 'assistant' });
    render(
      <MessageItem
        message={msg}
        modeTag={{ id: 'risk', label: 'Risk Scanner', description: '', model: '', prompt: '' }}
      />,
    );
    expect(screen.getByText('Risk Scanner')).toBeInTheDocument();
  });

  it('shows document name for user messages with doc', () => {
    const msg = makeMessage({ role: 'user', metadata: { docName: 'contract.pdf' } });
    render(<MessageItem message={msg} />);
    expect(screen.getByText('contract.pdf')).toBeInTheDocument();
  });

  it('shows streaming caret when streaming with no text', () => {
    const msg = makeMessage({ role: 'assistant', parts: [] });
    render(<MessageItem message={msg} streaming={true} />);
    expect(screen.getByText('thinking…')).toBeInTheDocument();
  });

  it('renders disclaimer when not already in text', () => {
    const msg = makeMessage({ role: 'assistant', parts: [{ type: 'text', text: 'Some response' }] });
    render(<MessageItem message={msg} />);
    expect(screen.getByText(/not legal advice/i)).toBeInTheDocument();
  });

  it('does not duplicate disclaimer when already in text', () => {
    const msg = makeMessage({
      role: 'assistant',
      parts: [{ type: 'text', text: 'Response. This is general information, not legal advice.' }],
    });
    render(<MessageItem message={msg} />);
    const disclaimers = screen.getAllByText(/not legal advice/i);
    expect(disclaimers).toHaveLength(1);
  });
});
