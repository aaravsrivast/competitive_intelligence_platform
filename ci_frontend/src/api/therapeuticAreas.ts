import type { Indication, TherapeuticArea } from "@/types/domain";
import { MOCK_INDICATIONS, MOCK_THERAPEUTIC_AREAS } from "@/lib/mockData";
import { mockDelay } from "./client";

export async function listTherapeuticAreas(): Promise<TherapeuticArea[]> {
  return mockDelay(MOCK_THERAPEUTIC_AREAS);
}

export async function listIndications(): Promise<Indication[]> {
  return mockDelay(MOCK_INDICATIONS);
}

export async function getIndication(id: string): Promise<Indication | undefined> {
  return mockDelay(MOCK_INDICATIONS.find((i) => i.id === id));
}
