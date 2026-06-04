import type { CompetitiveLandscapeCard, Phase } from "@/types/domain";
import { apiFetch } from "./client";
import { clCreateToBackend, clPatchToBackend, mapCLCard } from "./mappers";

export async function listCLCards(indicationId: string): Promise<CompetitiveLandscapeCard[]> {
  const data = await apiFetch<{ phases: Record<string, Record<string, unknown>[]> }>(
    `/competitive-landscape/kanban?indication_id=${encodeURIComponent(indicationId)}`,
  );
  const cards: CompetitiveLandscapeCard[] = [];
  for (const phaseCards of Object.values(data.phases ?? {})) {
    for (const doc of phaseCards) {
      cards.push(mapCLCard(doc));
    }
  }
  return cards;
}

export async function updateCLCard(
  id: string,
  patch: Partial<CompetitiveLandscapeCard>,
): Promise<CompetitiveLandscapeCard> {
  const body = clPatchToBackend(patch);
  const doc = await apiFetch<Record<string, unknown>>(`/competitive-landscape/${id}`, {
    method: "PATCH",
    body,
  });
  return mapCLCard(doc);
}

export async function moveCLCard(id: string, phase: Phase): Promise<CompetitiveLandscapeCard> {
  const doc = await apiFetch<Record<string, unknown>>(`/competitive-landscape/${id}/phase`, {
    method: "PATCH",
    body: { phase },
  });
  return mapCLCard(doc);
}

export async function createCLCard(
  card: Omit<CompetitiveLandscapeCard, "id" | "last_updated">,
): Promise<CompetitiveLandscapeCard> {
  const doc = await apiFetch<Record<string, unknown>>("/competitive-landscape", {
    method: "POST",
    body: clCreateToBackend(card),
  });
  return mapCLCard(doc);
}
