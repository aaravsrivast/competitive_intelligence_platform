import type { ChatMessage } from "@/types/domain";
import { mockDelay } from "./client";

const store = new Map<string, ChatMessage[]>();

export async function listMessages(conversationKey: string): Promise<ChatMessage[]> {
  return mockDelay(store.get(conversationKey) ?? []);
}

export async function sendMessage(conversationKey: string, content: string): Promise<{ user: ChatMessage; assistant: ChatMessage }> {
  const now = Date.now();
  const user: ChatMessage = {
    id: `msg-u-${now}`,
    conversationKey,
    role: "user",
    content,
    createdAt: new Date(now).toISOString(),
  };
  const assistant: ChatMessage = {
    id: `msg-a-${now + 1}`,
    conversationKey,
    role: "assistant",
    content: synthesize(content),
    createdAt: new Date(now + 800).toISOString(),
  };
  const list = store.get(conversationKey) ?? [];
  store.set(conversationKey, [...list, user, assistant]);
  // Simulate latency for realism.
  await new Promise((r) => setTimeout(r, 900));
  return { user, assistant };
}

export async function clearConversation(conversationKey: string): Promise<void> {
  store.delete(conversationKey);
  return mockDelay(undefined, 50);
}

function synthesize(prompt: string): string {
  const trimmed = prompt.trim();
  if (/competitor|landscape/i.test(trimmed)) {
    return "There are 14 active competitor assets in this indication. The most advanced are in Phase 3 with primary completion expected in 2026. Want me to compare the top 3 by mechanism of action?";
  }
  if (/trial|nct/i.test(trimmed)) {
    return "I tracked 14 ongoing trials across 6 phases. The most recently updated is currently recruiting in 12 countries. I can pull the full study design or enrollment criteria — just say which.";
  }
  if (/news|update/i.test(trimmed)) {
    return "The latest high-priority items include a Phase 3 readout, an FDA Breakthrough Designation, and a strategic acquisition. Want a summary email of the top 5?";
  }
  return `Got it — "${trimmed.slice(0, 80)}". In a production build I'd answer using the indication's full corpus. For now this is a mocked response confirming the flow works end-to-end.`;
}
