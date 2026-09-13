'use client';

import { useEffect, useRef } from 'react';
import {
  ChatCircle,
  CircleNotch,
  Folders,
  House,
  ListChecks,
  MagicWand,
  PenNib,
  Scales,
  Sparkle,
  Warning,
  X,
} from '@phosphor-icons/react';
import type { UIMessage } from 'ai';
import type { ModeConfig } from '@/lib/modes';
import type { ModeId } from '@/lib/types';
import { MessageItem } from './MessageItem';
import { ModeIcon } from './ModeIcon';
import { uiText } from '@/lib/conv';

interface Props {
  messages: UIMessage[];
  modeOf: (msgId: string) => ModeConfig | undefined;
  streamingMsgId: string | null | undefined;
  working?: boolean;
  workingLabel?: string;
  title: string;
  activeDocName?: string;
  onRemoveDoc?: () => void;
  onSuggestion: (text: string) => void;
}

import type { Icon } from '@phosphor-icons/react';

interface Suggestion {
  icon: Icon;
  mode?: ModeId;
  label: string;
  text: string;
}

const SUGGESTIONS_DOC: Suggestion[] = [
  { icon: MagicWand, mode: 'summarize', label: 'Summarize in plain English', text: 'Summarize this document in plain English — what am I actually agreeing to?' },
  { icon: Warning, mode: 'risk', label: 'Scan it for risks', text: 'Scan this document for risky clauses, hidden obligations, and red flags.' },
  { icon: ListChecks, mode: 'checklist', label: 'Give me a checklist', text: 'Turn this document into an actionable checklist of what I need to do and when.' },
  { icon: ChatCircle, mode: 'ask', label: 'Ask about a section', text: 'What are the most important things in this document a non-lawyer should understand?' },
];

const SUGGESTIONS_NO_DOC: Suggestion[] = [
  { icon: House, label: 'Understand my rental lease', text: 'I just signed a rental agreement. What are the things I should watch out for?' },
  { icon: PenNib, label: 'Decode job offer terms', text: 'Walk me through a typical job offer contract — the clauses that actually matter.' },
  { icon: Folders, label: 'Compare two contracts', text: 'How can I compare two contracts to spot the differences that matter?' },
  { icon: ChatCircle, label: 'Just answer a question', text: 'Can you explain the difference between arbitration and going to court?' },
];

export function ChatArea({ messages, modeOf, streamingMsgId, working, workingLabel, title, activeDocName, onRemoveDoc, onSuggestion }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const last = messages[messages.length - 1];
  const isStreaming = streamingMsgId != null && last?.id === streamingMsgId;
  const lastText = last ? uiText(last) : '';

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (isStreaming || working) {
      el.scrollTop = el.scrollHeight;
    } else if (messages.length > 0) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, lastText, isStreaming, working]);

  const empty = messages.length === 0;
  const suggestions = activeDocName ? SUGGESTIONS_DOC : SUGGESTIONS_NO_DOC;

  return (
    <div ref={scrollRef} className="scroll-slim flex-1 overflow-y-auto">
      <div className="bg-ambient mx-auto min-h-full max-w-3xl px-4 py-10 sm:px-6">
        {empty ? (
          <div className="animate-fade flex min-h-full flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/30 bg-gradient-to-br from-accent-softer to-accent-soft text-accent-hi shadow-xl shadow-accent/10">
              <Scales size={28} weight="fill" aria-hidden />
            </div>
            <h1 className="text-legal mt-7 max-w-xl text-4xl font-semibold leading-[1.08] tracking-[-0.02em] text-foreground sm:text-5xl">
              Don&apos;t read the fine print.{' '}
              <span className="text-gradient-gold italic">Let it read itself.</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
              Upload a contract or paste one in, then pick what you want done — summaries, risk
              scans, comparisons, checklists, or plain Q&amp;A.
            </p>

            <div className="stagger mt-10 grid w-full max-w-lg grid-cols-1 gap-2.5 sm:grid-cols-2">
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  onClick={() => onSuggestion(s.text)}
                  className="card-surface group flex items-start gap-3 rounded-2xl px-4 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/30 hover:bg-surface-2 active:scale-[0.99]"
                >
                  {s.mode ? (
                    <ModeIcon id={s.mode} size={20} weight="fill" className="mt-0.5 shrink-0 text-accent-hi" />
                  ) : (
                    <s.icon size={20} weight="fill" className="mt-0.5 shrink-0 text-accent-hi" />
                  )}
                  <span className="text-sm font-medium leading-snug text-foreground/95">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="px-1 text-center">
              <h2 className="text-legal truncate text-lg font-semibold tracking-[-0.01em] text-foreground">{title}</h2>
              <p className="mt-1.5 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-2">
                <Sparkle size={11} className="text-accent" aria-hidden />
                {activeDocName ? (
                  <span className="inline-flex items-center gap-1.5">
                    Analyzing · <span className="text-muted">{activeDocName}</span>
                    {onRemoveDoc && (
                      <button
                        type="button"
                        onClick={onRemoveDoc}
                        className="rounded-full p-0.5 text-muted-2 transition-colors hover:bg-white/10 hover:text-foreground"
                        title="Remove document"
                        aria-label="Remove document"
                      >
                        <X size={11} weight="bold" />
                      </button>
                    )}
                  </span>
                ) : (
                  'Conversation'
                )}
              </p>
            </div>

            {messages.map((m) => (
              <MessageItem
                key={m.id}
                message={m}
                modeTag={m.role === 'assistant' ? (() => {
                  const cfg = modeOf(m.id);
                  return cfg ? ({ ...cfg }) : undefined;
                })() : undefined}
                streaming={m.id === streamingMsgId}
              />
            ))}

            {working && (
              <div className="animate-fade flex flex-col">
                <div className="flex items-center gap-2.5 text-[11px] text-muted">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-1 font-medium tracking-wide">
                    <Scales size={12} weight="fill" className="text-accent" aria-hidden />
                    FinePrint
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-3 rounded-2xl rounded-tl-md border border-accent/15 bg-surface-2 px-4 py-4 text-sm text-muted streaming-glow">
                  <CircleNotch size={16} className="animate-spin text-accent" aria-hidden />
                  <span className="text-foreground/90">{workingLabel}</span>
                  <span className="thinking-dots text-accent" aria-hidden />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}