'use client';

import type { UIMessage } from 'ai';
import { FileText, Scales } from '@phosphor-icons/react';
import { uiText } from '@/lib/conv';
import { Markdown } from './Markdown';
import { DISCLAIMER, type ModeConfig } from '@/lib/modes';
import { ModeIcon } from './ModeIcon';

interface Props {
  message: UIMessage;
  modeTag?: ModeConfig;
  streaming?: boolean;
}

export function MessageItem({ message, modeTag, streaming }: Props) {
  const text = uiText(message);
  const isUser = message.role === 'user';
  const docName = (message.metadata as { docName?: string } | undefined)?.docName;

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="flex max-w-[min(78%,42rem)] flex-col items-end gap-1.5">
          <div className="rounded-2xl rounded-br-md bg-gradient-to-br from-accent to-accent-deep px-4 py-3 text-[15px] leading-relaxed text-background shadow-lg shadow-accent/20">
            <p className="whitespace-pre-wrap">{text}</p>
          </div>
          {docName && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[11px] text-muted">
              <FileText size={11} weight="fill" className="text-accent" aria-hidden />
              {docName}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-1 font-medium tracking-wide">
          <Scales size={11} weight="fill" className="text-accent" aria-hidden />
          FinePrint
        </span>
        {modeTag && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.045] px-2.5 py-1">
            <ModeIcon id={modeTag.id} size={12} weight="fill" className="text-accent-hi" />
            <span className="text-muted">{modeTag.label}</span>
          </span>
        )}
      </div>

      <div className="mt-2 rounded-2xl rounded-tl-md border border-line bg-surface-2 px-4 py-3.5 shadow-xl shadow-black/20">
        {text ? (
          streaming ? (
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{text}</p>
          ) : (
            <Markdown content={text} />
          )
        ) : (
          <p className="text-sm text-muted">
            <span className="stream-caret" aria-hidden />
            thinking…
          </p>
        )}
        {streaming && text && <span className="stream-caret" aria-hidden />}
      </div>

      {streaming && (
        <p className="mt-1 text-[10px] uppercase tracking-widest text-accent/80">
          generating response
        </p>
      )}
      {!streaming && text && !text.includes(DISCLAIMER.slice(0, 40)) && (
        <p className="mt-2 border-l-2 border-accent/25 pl-3 text-[11px] leading-relaxed text-muted-2">
          This is general information, not legal advice. Consult a licensed professional for your
          situation.
        </p>
      )}
    </div>
  );
}