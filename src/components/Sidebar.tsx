'use client';

import { useState } from 'react';
import {
  ChatCircle,
  Check,
  FileText,
  PencilSimple,
  Plus,
  Scales,
  SignOut,
  Trash,
  X,
} from '@phosphor-icons/react';
import type { ConversationMeta } from '@/lib/types';
import { timeAgo } from '@/lib/conv';

interface Props {
  conversations: ConversationMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  user: { name: string | null; email: string | null; photoURL: string | null } | null;
  onSignOut: () => void;
  variant?: 'desktop' | 'mobile';
}

interface Group {
  label: string;
  items: ConversationMeta[];
}

function groupConversations(convs: ConversationMeta[]): Group[] {
  const today = Date.now() - 86_400_000;
  const week = Date.now() - 7 * 86_400_000;
  const groups: Group[] = [
    { label: 'Today', items: [] },
    { label: 'This week', items: [] },
    { label: 'Older', items: [] },
  ];
  for (const c of convs) {
    if (c.updatedAt >= today) groups[0].items.push(c);
    else if (c.updatedAt >= week) groups[1].items.push(c);
    else groups[2].items.push(c);
  }
  return groups.filter((g) => g.items.length > 0);
}

function Row({
  conv,
  active,
  onSelect,
  onRename,
  onDelete,
}: {
  conv: ConversationMeta;
  active: boolean;
  onSelect: () => void;
  onRename: (t: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(conv.title);
  const [hover, setHover] = useState(false);

  const commit = () => {
    setEditing(false);
    const t = value.trim();
    if (t && t !== conv.title) onRename(t);
    else setValue(conv.title);
  };

  return (
<div
        className={`group relative flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-all duration-150 ${
          active
            ? 'border-accent/25 bg-accent-soft'
            : 'border-transparent hover:border-line hover:bg-white/[0.045]'
        }`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
      {editing ? (
        <>
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') {
                setValue(conv.title);
                setEditing(false);
              }
            }}
            onBlur={commit}
            className="min-w-0 flex-1 rounded-md border border-accent/40 bg-surface px-1.5 py-0.5 text-sm text-foreground focus:outline-none"
          />
          <button onClick={commit} aria-label="Save title" className="text-accent">
            <Check size={14} weight="bold" />
          </button>
          <button
            onClick={() => {
              setValue(conv.title);
              setEditing(false);
            }}
            aria-label="Cancel"
            className="text-muted"
          >
            <X size={14} weight="bold" />
          </button>
        </>
      ) : (
        <>
          <button
            onClick={onSelect}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
            title={conv.title}
          >
            {conv.hasDoc ? (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent-softer text-accent">
                <FileText size={12} weight="fill" aria-hidden />
              </span>
            ) : (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/[0.045] text-muted">
                <ChatCircle size={12} weight="fill" aria-hidden />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className={`block truncate text-sm ${active ? 'font-semibold text-foreground' : 'text-foreground/85'}`}>
                {conv.title}
              </span>
              <span className="block text-[10px] tabular text-muted-2">{timeAgo(conv.updatedAt)}</span>
            </span>
          </button>
          {(hover || active) && (
            <span className="flex shrink-0 items-center gap-0.5">
              <button
                onClick={() => setEditing(true)}
                aria-label="Rename chat"
                className="rounded-md p-1 text-muted transition-colors hover:bg-white/10 hover:text-foreground"
              >
                <PencilSimple size={13} weight="bold" />
              </button>
              <button
                onClick={onDelete}
                aria-label="Delete chat"
                className="rounded-md p-1 text-muted transition-colors hover:bg-danger-soft hover:text-danger"
              >
                <Trash size={13} weight="bold" />
              </button>
            </span>
          )}
        </>
      )}
    </div>
  );
}

export function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  user,
  onSignOut,
  variant = 'desktop',
}: Props) {
  const groups = groupConversations(conversations);

  const display = variant === 'mobile' ? 'flex md:hidden' : 'hidden md:flex';

  return (
    <aside className={`${display} w-72 shrink-0 flex-col border-r border-line bg-surface`}>
      <div className="flex items-center gap-3 px-5 pb-5 pt-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/30 bg-gradient-to-br from-accent-softer to-accent-soft text-accent-hi shadow-lg shadow-accent/10">
          <Scales size={19} weight="fill" aria-hidden />
        </span>
        <div className="leading-tight">
          <p className="text-legal text-xl font-semibold tracking-[-0.02em] text-foreground">
            Fine<span className="text-gradient-gold italic">Print</span>
          </p>
          <p className="text-[9px] uppercase tracking-[0.22em] text-muted-2">
            legal, simplified
          </p>
        </div>
      </div>

      <div className="px-3">
        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-accent/35 bg-accent-soft px-3 py-2.5 text-sm font-semibold text-accent-hi transition-all duration-150 hover:bg-accent/20 active:scale-[0.98]"
        >
          <Plus size={16} weight="bold" aria-hidden />
          New chat
        </button>
      </div>

      <nav className="scroll-slim mt-4 flex-1 space-y-4 overflow-y-auto px-3 pb-4">
        {groups.length === 0 && (
          <p className="px-2 text-xs leading-relaxed text-muted-2">
            No conversations yet. Start chatting — upload a contract or paste one in.
          </p>
        )}
        {groups.map((g) => (
          <div key={g.label}>
            <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-2/80">
              {g.label}
            </p>
            <div className="space-y-1">
              {g.items.map((c) => (
                <Row
                  key={c.id}
                  conv={c}
                  active={c.id === activeId}
                  onSelect={() => onSelect(c.id)}
                  onRename={(t) => onRename(c.id, t)}
                  onDelete={() => onDelete(c.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          {user?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt="" className="h-9 w-9 rounded-xl object-cover" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 text-xs font-bold text-accent-hi">
              {(user?.name ?? user?.email ?? '?').charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium text-foreground">{user?.name ?? 'You'}</p>
            <p className="truncate text-[11px] text-muted-2">{user?.email}</p>
          </div>
          <button
            onClick={onSignOut}
            aria-label="Sign out"
            className="rounded-lg p-2 text-muted transition-colors hover:bg-white/10 hover:text-foreground"
          >
            <SignOut size={15} weight="bold" />
          </button>
        </div>
      </div>
    </aside>
  );
}