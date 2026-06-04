import type { Competitor } from "@/types/domain";
import { MOCK_COMPETITORS } from "@/lib/mockData";
import { mockDelay } from "./client";

export async function listCompetitors(): Promise<Competitor[]> {
  return mockDelay(MOCK_COMPETITORS);
}
