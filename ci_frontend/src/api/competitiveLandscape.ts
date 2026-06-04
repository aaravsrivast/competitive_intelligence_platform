import type { CompetitiveLandscapeCard, Phase } from "@/types/domain";
import { MOCK_CL_CARDS } from "@/lib/mockData";
import { mockDelay } from "./client";

// In-memory mutable copy so edits/adds/moves persist for the session.
let cards: CompetitiveLandscapeCard[] = [...MOCK_CL_CARDS];

export async function listCLCards(indicationId: string): Promise<CompetitiveLandscapeCard[]> {
  return mockDelay(cards.filter((c) => c.indicationId === indicationId));
}

export async function updateCLCard(id: string, patch: Partial<CompetitiveLandscapeCard>): Promise<CompetitiveLandscapeCard> {
  cards = cards.map((c) => (c.id === id ? { ...c, ...patch, last_updated: new Date().toISOString() } : c));
  const updated = cards.find((c) => c.id === id);
  if (!updated) throw new Error("Card not found");
  return mockDelay(updated, 150);
}

export async function moveCLCard(id: string, phase: Phase): Promise<CompetitiveLandscapeCard> {
  return updateCLCard(id, { phase });
}

export async function createCLCard(card: Omit<CompetitiveLandscapeCard, "id" | "last_updated">): Promise<CompetitiveLandscapeCard> {
  const created: CompetitiveLandscapeCard = {
    ...card,
    id: `cl-new-${Date.now()}`,
    last_updated: new Date().toISOString(),
  };
  cards = [created, ...cards];
  return mockDelay(created, 150);
}
