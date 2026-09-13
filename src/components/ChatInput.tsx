'use client';

import { useRef, useState, useEffect } from 'react';
import {
  CircleNotch,
  FileText,
  Paperclip,
  PaperPlaneTilt,
  Square,
  X,
} from '@phosphor-icons/react';
import type { ModeConfig } from '@/lib/modes';
import { ModeSelector } from './ModeSelector';

export interface ParseState {
  status: 'idle' | 'parsing' | 'error';
  name?: string;
  progress?: { current: number; total: number };
  message?: string;
}

interface Props {
  mode: ModeConfig;
  onModeChange: (m: ModeConfig) => void;
  onSend: (text: string) => void;
  onUpload: (file: File) => void;
  onStop: () => void;
  onRemoveDoc: () => void;
  isStreaming: boolean;
  parse: ParseState;
  docName?: string;
  disabled?: boolean;
}

export function ChatInput({
  mode,
  onModeChange,
  onSend,
  onUpload,
  onStop,
  onRemoveDoc,
  isStreaming,
  parse,
  docName,
  disabled,
}: Props) {
  const [text, setText] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const canSend = !disabled && text.trim().length > 0 && !isStreaming;

  const submit = () => {
    const t = text.trim();
    if (!t || isStreaming || disabled) return;
    setText('');
    onSend(t);
  };

  return (
    <div className="border-t border-line bg-gradient-to-t from-background via-background/90 to-background/60 px-4 pb-5 pt-3 backdrop-blur sm:px-6">
      {(docName || parse.status !== 'idle') && (
        <div className="mx-auto mb-3 flex max-w-3xl animate-pop items-center gap-2.5 rounded-xl border border-accent/30 bg-accent-soft py-2 pl-3 pr-2 backdrop-blur-sm">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
            <FileText size={13} weight="fill" aria-hidden />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-foreground">
            {parse.name ?? docName}
          </span>
          {parse.status === 'parsing' && parse.progress && (
            <span className="shrink-0 rounded-md bg-background/40 px-1.5 py-0.5 text-[11px] font-medium tabular text-accent-hi">
              {parse.progress.current}/{parse.progress.total}
            </span>
          )}
          {parse.status === 'parsing' && !parse.progress && (
            <CircleNotch size={14} className="shrink-0 animate-spin text-accent" aria-hidden />
          )}
          {(parse.status === 'idle' || parse.status === 'error') && (
            <button
              type="button"
              onClick={onRemoveDoc}
              className="shrink-0 rounded-full p-1 text-muted transition-colors hover:bg-white/10 hover:text-foreground"
              aria-label={parse.status === 'idle' ? 'Remove document' : 'Dismiss'}
            >
              <X size={14} weight="bold" />
            </button>
          )}
        </div>
      )}

      {parse.status === 'error' && (
        <p className="mx-auto mb-2 max-w-3xl text-center text-xs text-danger">
          {parse.message ?? "Couldn&apos;t read that file. Try a text-based PDF, not a scanned image."}
        </p>
      )}

      <div className="hairline-top mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-line bg-surface/90 p-2 shadow-2xl shadow-black/40 backdrop-blur-md transition-shadow duration-200 focus-within:border-accent/45 focus-within:shadow-accent/10">
        <div className="mb-0.5">
          <ModeSelector value={mode} onChange={onModeChange} disabled={disabled || isStreaming} />
        </div>

        <textarea
          ref={taRef}
          rows={1}
          value={text}
          disabled={disabled}
          placeholder="Paste your contract, ask a question…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          className="min-h-[44px] max-h-40 flex-1 resize-none bg-transparent px-2 py-2.5 text-[15px] text-foreground placeholder:text-muted focus:outline-none disabled:opacity-50"
        />

        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.currentTarget.value = '';
          }}
        />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled || parse.status === 'parsing'}
          title="Upload a PDF"
          className="mb-0.5 shrink-0 rounded-xl border border-line bg-surface-2 p-2.5 text-muted transition-all duration-150 hover:border-accent/35 hover:text-accent active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {parse.status === 'parsing' ? (
            <CircleNotch size={17} className="animate-spin text-accent" aria-hidden />
          ) : (
            <Paperclip size={17} aria-hidden />
          )}
        </button>

        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="mb-0.5 flex shrink-0 items-center gap-1.5 rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-danger/50 hover:text-danger"
          >
            <Square size={13} weight="fill" aria-hidden />
            <span className="hidden sm:inline">Stop</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            className={`mb-0.5 flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150
              ${canSend
                ? 'bg-accent text-background shadow-lg shadow-accent/25 hover:bg-accent-hi active:scale-[0.98]'
                : 'cursor-not-allowed border border-line bg-surface-2 text-muted opacity-60'}`}
          >
            <PaperPlaneTilt size={15} weight="fill" aria-hidden />
            <span className="hidden sm:inline">Send</span>
          </button>
        )}
      </div>

      <p className="mx-auto mt-3 hidden max-w-3xl text-center text-[10px] leading-relaxed text-muted-2 sm:block">
        FinePrint is an AI information assistant — not a lawyer. Your answers are general info, not
        legal advice. You can paste a contract or upload a PDF to work with.
      </p>
    </div>
  );
}