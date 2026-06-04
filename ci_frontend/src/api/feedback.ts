import type { Feedback } from "@/types/domain";
import { apiFetch } from "./client";
import { mapFeedback } from "./mappers";

export async function submitFeedback(input: {
  userId: string;
  rating: number;
  message: string;
}): Promise<Feedback> {
  const doc = await apiFetch<Record<string, unknown>>("/feedbacks", {
    method: "POST",
    body: {
      message: input.message,
      rating: input.rating,
      context_type: "general",
    },
  });
  return mapFeedback({ ...doc, user_id: input.userId });
}
