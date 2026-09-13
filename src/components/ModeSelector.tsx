'use client';

import { useRef, useState, useEffect } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import type { ModeConfig } from '@/lib/modes';
import { MODES } from '@/lib/modes';
import { ModeIcon } from './ModeIcon';

interface Props {
  value: ModeConfig;
  onChange: (m: ModeConfig) => void;
  disabled?: boolean;
}

export function ModeSelector({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`group flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200
          ${open
            ? 'border-accent/45 bg-accent-soft shadow-lg shadow-accent/5'
            : 'border-line bg-surface-2 hover:border-accent/30 hover:bg-surface-3'}
          disabled:cursor-not-allowed disabled:opacity-50`}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={value.description}
      >
        <span className={open ? 'text-accent' : 'text-accent-hi'}>
          <ModeIcon id={value.id} size={16} weight="fill" />
        </span>
        <span className="max-w-[10rem] truncate text-foreground">{value.label}</span>
        <CaretDown
          size={13}
          weight="bold"
          className={`text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="lookup-card absolute bottom-full left-0 z-30 mb-3 w-[21rem] animate-pop rounded-2xl p-2 sm:w-[23rem]"
        >
          <p className="px-3 pb-2 pt-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-2">
            What do you want to do?
          </p>
          <ul className="space-y-1">
            {MODES.map((m) => {
              const active = m.id === value.id;
              return (
                <li key={m.id}>
                  <button
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(m);
                      setOpen(false);
                    }}
                    className={`group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150
                      ${active ? 'bg-accent-soft' : 'hover:bg-white/[0.045]'}`}
                  >
                    <span
                      className={`mt-px flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors
                        ${active
                          ? 'border-accent/40 bg-accent/15 text-accent-hi'
                          : 'border-line bg-surface-2 text-muted group-hover:border-accent/25 group-hover:text-accent'}`}
                      aria-hidden
                    >
                      <ModeIcon id={m.id} size={16} weight="fill" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className={`text-sm font-semibold ${active ? 'text-foreground' : 'text-foreground/90'}`}>
                          {m.label}
                        </span>
                        {active && (
                          <span className="rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-background">
                            Active
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-muted">{m.description}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}