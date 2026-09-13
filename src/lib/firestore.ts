import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  writeBatch,
  getFirestore,
  type Timestamp,
} from 'firebase/firestore';
import { getApp } from './firebase';
import type { ConversationDetail, ConversationMeta, ModeId, StoredMessage } from './types';

const db = getFirestore(getApp());

function convData(docData: Record<string, unknown>): ConversationMeta {
  return {
    id: docData.id as string,
    title: (docData.title as string) ?? 'Untitled',
    mode: (docData.mode as ModeId) ?? 'ask',
    docName: docData.docName as string | undefined,
    hasDoc: !!(docData.hasDoc as boolean | undefined),
    createdAt: (docData.createdAt as number) ?? Date.now(),
    updatedAt: (docData.updatedAt as number) ?? Date.now(),
  };
}

export async function listConversations(uid: string): Promise<ConversationMeta[]> {
  const q = query(collection(db, 'conversations'), where('ownerId', '==', uid));
  const snap = await getDocs(q);
  const convs = snap.docs.map((d) => convData({ id: d.id, ...d.data() }));
  convs.sort((a, b) => b.updatedAt - a.updatedAt);
  return convs;
}

export async function getConversation(id: string): Promise<ConversationDetail | null> {
  const snap = await getDoc(doc(db, 'conversations', id));
  if (!snap.exists()) return null;
  return { ...convData({ id: snap.id, ...snap.data() }), docText: (snap.data().docText as string) ?? undefined };
}

export async function createConversation(
  uid: string,
  opts: { title?: string; mode?: ModeId; docName?: string; docText?: string },
): Promise<string> {
  const now = Date.now();
  const ref = await addDoc(collection(db, 'conversations'), {
    ownerId: uid,
    title: opts.title ?? 'New chat',
    mode: opts.mode ?? 'ask',
    docName: opts.docName ?? null,
    docText: opts.docText ?? null,
    hasDoc: !!(opts.docText || opts.docName),
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateConversation(id: string, partial: Record<string, unknown>) {
  await updateDoc(doc(db, 'conversations', id), { ...partial, updatedAt: Date.now() });
}

export async function renameConversation(id: string, title: string) {
  await updateConversation(id, { title });
}

export async function deleteConversation(id: string) {
  const msgs = await getDocs(collection(doc(db, 'conversations', id), 'messages'));
  const batch = writeBatch(db);
  msgs.forEach((m) => batch.delete(m.ref));
  batch.delete(doc(db, 'conversations', id));
  await batch.commit();
}

export async function saveMessages(convId: string, messages: StoredMessage[]) {
  const batch = writeBatch(db);
  for (const m of messages) {
    const ref = doc(collection(doc(db, 'conversations', convId), 'messages'), m.id);
    batch.set(ref, {
      role: m.role,
      content: m.content,
      mode: m.mode,
      docName: m.docName ?? null,
      createdAt: m.createdAt,
    });
  }
  await batch.commit();
  await updateConversation(convId, { updatedAt: Date.now() });
}

function tsToMs(value: unknown): number {
  if (value == null) return Date.now();
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && 'seconds' in (value as Timestamp)) {
    const t = value as Timestamp;
    return t.seconds * 1000 + t.nanoseconds / 1e6;
  }
  return Date.now();
}

export async function loadMessages(convId: string): Promise<StoredMessage[]> {
  const snap = await getDocs(collection(doc(db, 'conversations', convId), 'messages'));
  const msgs = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      role: data.role as 'user' | 'assistant',
      content: (data.content as string) ?? '',
      mode: (data.mode as ModeId) ?? 'ask',
      docName: (data.docName as string | undefined) ?? undefined,
      createdAt: tsToMs(data.createdAt),
    };
  });
  msgs.sort((a, b) => a.createdAt - b.createdAt);
  return msgs;
}

export async function setConversationDoc(convId: string, docName: string, docText: string) {
  await updateConversation(convId, { docName, docText, hasDoc: true });
}

export async function waitFor(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}