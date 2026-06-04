import type { ClinicalTrial } from "@/types/domain";
import { MOCK_TRIALS } from "@/lib/mockData";
import { mockDelay } from "./client";

export async function listTrials(indicationId: string): Promise<ClinicalTrial[]> {
  return mockDelay(MOCK_TRIALS.filter((t) => t.indicationId === indicationId));
}

export async function syncTrial(nctId: string): Promise<ClinicalTrial | undefined> {
  return mockDelay(MOCK_TRIALS.find((t) => t.nct_id === nctId), 600);
}
