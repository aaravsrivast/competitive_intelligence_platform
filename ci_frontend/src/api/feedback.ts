import type { Feedback } from "@/types/domain";
import { mockDelay } from "./client";

const all: Feedback[] = [];

export async function submitFeedback(input: { userId: string; rating: number; message: string }): Promise<Feedback> {
  const created: Feedback = { id: `fb-${Date.now()}`, ...input, createdAt: new Date().toISOString() };
  all.push(created);
  return mockDelay(created, 200);
}
