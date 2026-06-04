import type { ClinicalTrial } from "@/types/domain";
import { apiFetch, apiFetchPaginated } from "./client";
import { mapClinicalTrial } from "./mappers";

export async function listTrials(indicationId: string): Promise<ClinicalTrial[]> {
  const docs = await apiFetchPaginated<Record<string, unknown>>("/clinical-trials", { limit: 200 });
  return docs.map((d) => mapClinicalTrial(d, indicationId));
}

export async function syncTrial(nctId: string): Promise<ClinicalTrial | undefined> {
  const doc = await apiFetch<Record<string, unknown>>(
    `/clinical-trials/sync/${encodeURIComponent(nctId)}`,
    { method: "POST" },
  );
  return mapClinicalTrial(doc);
}
