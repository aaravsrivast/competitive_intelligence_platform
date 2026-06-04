import type { ChatMessage } from "@/types/domain";
import { apiFetch } from "./client";
import { mapChatMessage, parseConversationKey } from "./mappers";

export async function listMessages(conversationKey: string): Promise<ChatMessage[]> {
  const { indicationId } = parseConversationKey(conversationKey);
  const params = new URLSearchParams({ limit: "200" });
  if (indicationId) params.set("indication_id", indicationId);
  const data = await apiFetch<{ messages: Record<string, unknown>[] }>(
    `/chatbot/history?${params}`,
  );
  return (data.messages ?? []).map((m) => mapChatMessage(m, conversationKey));
}

export async function sendMessage(
  conversationKey: string,
  content: string,
): Promise<{ user: ChatMessage; assistant: ChatMessage }> {
  const { indicationId } = parseConversationKey(conversationKey);
  const now = new Date().toISOString();
  const user: ChatMessage = {
    id: `msg-u-${Date.now()}`,
    conversationKey,
    role: "user",
    content,
    createdAt: now,
  };

  const data = await apiFetch<{ reply: string }>("/chatbot/message", {
    method: "POST",
    body: {
      message: content,
      indication_id: indicationId || undefined,
    },
  });

  const assistant: ChatMessage = {
    id: `msg-a-${Date.now()}`,
    conversationKey,
    role: "assistant",
    content: data.reply,
    createdAt: new Date().toISOString(),
  };

  return { user, assistant };
}

export async function clearConversation(_conversationKey: string): Promise<void> {
  // Server has no clear endpoint; UI clears local optimistic state only.
}
