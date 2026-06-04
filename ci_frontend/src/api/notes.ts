import type { Note } from "@/types/domain";
import { mockDelay } from "./client";

const store = new Map<string, Note[]>(); // key: `${userId}:${indicationId}`

const k = (userId: string, indicationId: string) => `${userId}:${indicationId}`;

export async function listNotes(userId: string, indicationId: string): Promise<Note[]> {
  return mockDelay(store.get(k(userId, indicationId)) ?? []);
}

export async function upsertNote(input: { id?: string; userId: string; indicationId: string; content: string }): Promise<Note> {
  const key = k(input.userId, input.indicationId);
  const list = store.get(key) ?? [];
  const now = new Date().toISOString();
  if (input.id) {
    const updated = list.map((n) => (n.id === input.id ? { ...n, content: input.content, updatedAt: now } : n));
    store.set(key, updated);
    const found = updated.find((n) => n.id === input.id);
    if (!found) throw new Error("Note not found");
    return mockDelay(found, 100);
  }
  const created: Note = { id: `note-${Date.now()}`, userId: input.userId, indicationId: input.indicationId, content: input.content, updatedAt: now };
  store.set(key, [created, ...list]);
  return mockDelay(created, 100);
}

export async function deleteNote(userId: string, indicationId: string, noteId: string): Promise<void> {
  const key = k(userId, indicationId);
  store.set(key, (store.get(key) ?? []).filter((n) => n.id !== noteId));
  return mockDelay(undefined, 80);
}
