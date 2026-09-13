'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, generateId, type UIMessage } from 'ai';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { List, Warning } from '@phosphor-icons/react';
import { ModeIcon } from './ModeIcon';
import { getFirebaseAuth, signInWithGoogle, signOutUser } from '@/lib/firebase';
import * as fp from '@/lib/firestore';
import { getMode, type ModeConfig } from '@/lib/modes';
import type { ConversationMeta, ModeId, StoredMessage } from '@/lib/types';
import { heuristicTitle, nowMs, storedToUIMessage, uiText } from '@/lib/conv';
import { parsePdf } from '@/lib/pdf';
import { Sidebar } from './Sidebar';
import { ChatArea } from './ChatArea';
import { ChatInput, type ParseState } from './ChatInput';
import { LoginScreen } from './LoginScreen';

const FIREBASE_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
);

export function ChatApp() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(!FIREBASE_CONFIGURED ? false : true);
  const [signingIn, setSigningIn] = useState(false);

  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<ModeConfig>(getMode('ask'));
  const [activeDoc, setActiveDoc] = useState<{ name: string; text: string } | null>(null);
  const [parse, setParse] = useState<ParseState>({ status: 'idle' });
  const [modeMap, setModeMap] = useState<Record<string, ModeConfig>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadedTitle, setLoadedTitle] = useState<string | undefined>();

  const activeIdRef = useRef<string | null>(null);
  const modeRef = useRef<ModeId>('ask');
  const userRef = useRef<User | null>(null);
  const messagesRef = useRef<UIMessage[]>([]);
  const activeDocRef = useRef<{ name: string; text: string } | null>(null);
  const titledRef = useRef<Set<string>>(new Set());

  const { messages, setMessages, sendMessage, regenerate, stop, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    onFinish: ({ message, isError, isAbort }) => {
      const convId = activeIdRef.current;
      const uid = userRef.current;
      if (isError || isAbort || !convId || !uid) return;
      const text = uiText(message);
      if (!text) return;
      const assistant: StoredMessage = {
        id: message.id,
        role: 'assistant',
        content: text,
        mode: modeRef.current,
        createdAt: nowMs(),
      };
      const cfg = getMode(modeRef.current);
      setModeMap((prev) => ({ ...prev, [message.id]: cfg }));
      void fp.saveMessages(convId, [assistant]);
      void fp.updateConversation(convId, { mode: modeRef.current });
      void maybeTitle(convId);
    },
  });

  useEffect(() => {
    userRef.current = user;
  }, [user]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    modeRef.current = mode.id;
  }, [mode]);

  const maybeTitle = useCallback(
    async (convId: string) => {
      if (titledRef.current.has(convId)) return;
      titledRef.current.add(convId);
      const firstUser = messagesRef.current.find((m) => m.role === 'user');
      if (!firstUser) return;
      const topic = uiText(firstUser).slice(0, 1500);
      let title: string;
      try {
        const uid = userRef.current;
        if (!uid) throw new Error('no user');
        const token = await uid.getIdToken();
        const res = await fetch('/api/title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, userId: uid.uid, idToken: token }),
        });
        const data = (await res.json()) as { title?: string };
        title = data.title?.trim() ? data.title : heuristicTitle(topic);
      } catch {
        title = heuristicTitle(topic);
      }
      await fp.renameConversation(convId, title);
      setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, title } : c)));
    },
    [],
  );

  const ensureConversation = useCallback(async (): Promise<string> => {
    if (activeIdRef.current) return activeIdRef.current;
    const uid = userRef.current;
    if (!uid) throw new Error('Not signed in');
    const id = await fp.createConversation(uid.uid, { mode: modeRef.current, title: 'New chat' });
    const meta: ConversationMeta = {
      id,
      title: 'New chat',
      mode: modeRef.current,
      hasDoc: false,
      createdAt: nowMs(),
      updatedAt: nowMs(),
    };
    setConversations((prev) => [meta, ...prev]);
    activeIdRef.current = id;
    setActiveId(id);
    return id;
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      const uid = userRef.current;
      if (!uid) return;
      const convId = activeIdRef.current ?? (await ensureConversation());
      const modeNow = modeRef.current;
      const cfg = getMode(modeNow);
      const doc = activeDocRef.current;
      const docName = doc?.name;
      const userMsgId = generateId();
      const userMsg: StoredMessage = {
        id: userMsgId,
        role: 'user',
        content: text,
        mode: modeNow,
        docName,
        createdAt: nowMs(),
      };
      setModeMap((prev) => ({ ...prev, [userMsgId]: cfg }));
      setMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          role: 'user',
          parts: [{ type: 'text', text }],
          metadata: docName ? { docName } : undefined,
        },
      ]);
      void fp.saveMessages(convId, [userMsg]);
      void fp.updateConversation(convId, { mode: modeNow });
      const token = await uid.getIdToken();
      await sendMessage(
        { text, messageId: userMsgId, metadata: docName ? { docName } : undefined },
        {
          body: {
            mode: modeNow,
            conversationId: convId,
            userId: uid.uid,
            idToken: token,
            docText: doc?.text,
          },
        },
      );
      setActiveDoc(null);
      activeDocRef.current = null;
    },
    [ensureConversation, sendMessage, setMessages],
  );

  const handleUpload = useCallback(
    async (file: File) => {
      setParse({ status: 'parsing', name: file.name });
      let text = '';
      try {
        const res = await parsePdf(file, (current, total) =>
          setParse({ status: 'parsing', name: file.name, progress: { current, total } }),
        );
        text = res.text;
      } catch {
        setParse({
          status: 'error',
          name: file.name,
          message: "Couldn't read that file. Try a text-based PDF, not a scanned image.",
        });
        return;
      }
      if (text.trim().length < 40) {
        setParse({
          status: 'error',
          name: file.name,
          message:
            "No readable text found in that PDF. It may be a scanned image — try an OCR'd or text-based PDF.",
        });
        return;
      }
      try {
        const convId = activeIdRef.current ?? (await ensureConversation());
        await fp.setConversationDoc(convId, file.name, text);
        setActiveDoc({ name: file.name, text });
        activeDocRef.current = { name: file.name, text };
        setParse({ status: 'idle' });
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, hasDoc: true, docName: file.name } : c)),
        );
      } catch {
        setParse({
          status: 'error',
          name: file.name,
          message:
            'The PDF was read, but saving to Firestore failed. Make sure you are signed in and the security rules are deployed.',
        });
      }
    },
    [ensureConversation],
  );

  const handleRemoveDoc = useCallback(async () => {
    setActiveDoc(null);
    activeDocRef.current = null;
    const convId = activeIdRef.current;
    if (convId) {
      await fp.updateConversation(convId, { docName: null, docText: null, hasDoc: false });
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, hasDoc: false, docName: undefined } : c)),
      );
    }
  }, []);

  const handleRetry = useCallback(async () => {
    const uid = userRef.current;
    if (!uid) return;
    const convId = activeIdRef.current;
    const lastUser = [...messagesRef.current].reverse().find((m) => m.role === 'user');
    const lastDocName = (lastUser?.metadata as { docName?: string } | undefined)?.docName;
    let docText: string | undefined;
    if (lastDocName && convId) {
      const detail = await fp.getConversation(convId);
      docText = detail?.docText;
    }
    const token = await uid.getIdToken();
    await regenerate({
      body: {
        mode: modeRef.current,
        conversationId: convId,
        userId: uid.uid,
        idToken: token,
        docText,
      },
    });
  }, [regenerate]);

  const handleNew = useCallback(() => {
    if (status === 'submitted' || status === 'streaming') void stop();
    setMessages([]);
    activeIdRef.current = null;
    setActiveId(null);
    setActiveDoc(null);
    activeDocRef.current = null;
    setLoadedTitle(undefined);
    setMode(getMode('ask'));
    setSidebarOpen(false);
  }, [status, stop, setMessages]);

  const handleSelect = useCallback(
    async (id: string) => {
      if (status === 'submitted' || status === 'streaming') await stop();
      const detail = await fp.getConversation(id);
      if (!detail) return;
      const stored = await fp.loadMessages(id);
      setMessages(stored.map(storedToUIMessage));
      const map: Record<string, ModeConfig> = {};
      for (const m of stored) map[m.id] = getMode(m.mode);
      setModeMap(map);
      activeIdRef.current = id;
      setActiveId(id);
      setLoadedTitle(detail.title);
      const m = getMode(detail.mode);
      setMode(m);
      modeRef.current = m.id;
      setActiveDoc(null);
      activeDocRef.current = null;
      if (detail.title !== 'New chat') titledRef.current.add(id);
      setSidebarOpen(false);
    },
    [status, stop, setMessages],
  );

  const handleRename = useCallback(async (id: string, title: string) => {
    titledRef.current.add(id);
    await fp.renameConversation(id, title);
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      await fp.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeIdRef.current === id) {
        activeIdRef.current = null;
        setActiveId(null);
        setMessages([]);
        setActiveDoc(null);
        activeDocRef.current = null;
      }
    },
    [setMessages],
  );

  // ── auth ────────────────────────────────────────────────
  useEffect(() => {
    if (!FIREBASE_CONFIGURED) return;
    const unsub = onAuthStateChanged(getFirebaseAuth(), (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        void fp.listConversations(u.uid).then(setConversations);
      } else {
        setConversations([]);
        activeIdRef.current = null;
        setActiveId(null);
      }
    });
    return unsub;
  }, []);

  const handleSignIn = useCallback(async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('sign-in failed', err);
    } finally {
      setSigningIn(false);
    }
  }, []);

  const activeMeta = conversations.find((c) => c.id === activeId);
  const activeTitle = activeId ? (activeMeta?.title ?? loadedTitle ?? 'Chat') : 'New chat';

  const streaming = status === 'submitted' || status === 'streaming';
  const streamingMsgId =
    messages.length > 0 && streaming ? messages[messages.length - 1]!.id : undefined;
  const working = status === 'submitted' || (status === 'streaming' && !streamingMsgId);
  const workingLabel = `${mode.label}…`;
  const docSent = activeDoc
    ? messages.some(
        (m) =>
          (m.metadata as { docName?: string } | undefined)?.docName === activeDoc.name,
      )
    : false;

  if (!FIREBASE_CONFIGURED) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <div className="max-w-md space-y-4 text-center">
          <div className="text-3xl">📋</div>
          <h1 className="text-xl font-semibold">FinePrint needs setup</h1>
          <p className="text-sm leading-relaxed text-muted">
            Copy <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs">.env.local.example</code>{' '}
            to <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs">.env.local</code>, add your
            Firebase project config (Google Sign-In on), plus a{' '}
            <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs">GEMINI_API_KEY</code>, then
            restart.
          </p>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" aria-label="Loading" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onSignIn={handleSignIn} loading={signingIn} />;
  }

  const userMeta = { name: user.displayName, email: user.email, photoURL: user.photoURL };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelect}
        onNew={handleNew}
        onRename={handleRename}
        onDelete={handleDelete}
        user={userMeta}
        onSignOut={signOutUser}
      />

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 animate-fade"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 animate-pop">
            <Sidebar
              conversations={conversations}
              activeId={activeId}
              onSelect={handleSelect}
              onNew={handleNew}
              onRename={handleRename}
              onDelete={handleDelete}
              user={userMeta}
              onSignOut={signOutUser}
              variant="mobile"
            />
          </div>
        </div>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface/40 px-4 backdrop-blur-sm sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-white/5 hover:text-foreground md:hidden"
            aria-label="Open conversations"
          >
            <List size={18} weight="bold" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold text-foreground">{activeTitle}</h1>
          </div>
          <span className="chip inline-flex items-center gap-1.5 px-3 py-1 text-xs text-accent-hi">
            <ModeIcon id={mode.id} size={13} weight="fill" />
            {mode.label}
          </span>
          {error && (
            <button
              onClick={() => void handleRetry()}
              className="inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger-soft px-3 py-1 text-xs font-medium text-danger transition-colors hover:bg-danger/15"
              title="The last response errored. Retry or check your API keys."
            >
              <Warning size={12} weight="fill" /> Retry
            </button>
          )}
        </header>

        <ChatArea
          messages={messages}
          modeOf={(id) => modeMap[id]}
          streamingMsgId={streamingMsgId}
          working={working}
          workingLabel={workingLabel}
          title={activeTitle}
          activeDocName={activeDoc?.name}
          onRemoveDoc={handleRemoveDoc}
          onSuggestion={handleSend}
        />

        <ChatInput
          mode={mode}
          onModeChange={(m) => setMode(m)}
          onSend={handleSend}
          onUpload={handleUpload}
          onStop={() => void stop()}
          onRemoveDoc={handleRemoveDoc}
          isStreaming={streaming}
          parse={parse}
          docName={activeDoc && !docSent ? activeDoc.name : undefined}
          disabled={!user}
        />
      </main>
    </div>
  );
}