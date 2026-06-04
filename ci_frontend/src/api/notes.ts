import type { Note } from "@/types/domain";
import { apiFetch, apiFetchPaginated } from "./client";
import { mapNote } from "./mappers";

const CONTEXT_TYPE = "indication";

export async function listNotes(_userId: string, indicationId: string): Promise<Note[]> {
  const docs = await apiFetchPaginated<Record<string, unknown>>("/notes", {
    context_type: CONTEXT_TYPE,
    context_id: indicationId,
    limit: 200,
  });
  return docs.map(mapNote);
}

export async function upsertNote(input: {
  id?: string;
  userId: string;
  indicationId: string;
  content: string;
}): Promise<Note> {
  if (input.id) {
    const doc = await apiFetch<Record<string, unknown>>(`/notes/${input.id}`, {
      method: "PATCH",
      body: { body: input.content },
    });
    return mapNote(doc);
  }
  const doc = await apiFetch<Record<string, unknown>>("/notes", {
    method: "POST",
    body: {
      body: input.content,
      context_type: CONTEXT_TYPE,
      context_id: input.indicationId,
    },
  });
  return mapNote(doc);
}

export async function deleteNote(
  _userId: string,
  _indicationId: string,
  noteId: string,
): Promise<void> {
  await apiFetch(`/notes/${noteId}`, { method: "DELETE" });
}
