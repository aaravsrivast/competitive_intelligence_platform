import type { Indication, TherapeuticArea } from "@/types/domain";
import { apiFetch, apiFetchPaginated } from "./client";
import { mapIndication, mapTherapeuticArea } from "./mappers";

export async function listTherapeuticAreas(): Promise<TherapeuticArea[]> {
  const areas = await apiFetchPaginated<Record<string, unknown>>("/therapeutic-areas");
  const indicationsByArea = await Promise.all(
    areas.map(async (area) => {
      const inds = await apiFetch<Record<string, unknown>[]>(
        `/therapeutic-areas/${area.id}/indications`,
      );
      return { areaId: String(area.id), ids: inds.map((i) => String(i.id)) };
    }),
  );
  const idMap = new Map(indicationsByArea.map((x) => [x.areaId, x.ids]));
  return areas.map((a) => mapTherapeuticArea(a, idMap.get(String(a.id)) ?? []));
}

export async function listIndications(): Promise<Indication[]> {
  const areas = await apiFetchPaginated<Record<string, unknown>>("/therapeutic-areas");
  const all: Indication[] = [];
  for (const area of areas) {
    const inds = await apiFetch<Record<string, unknown>[]>(`/therapeutic-areas/${area.id}/indications`);
    all.push(...inds.map(mapIndication));
  }
  return all;
}

export async function getIndication(id: string): Promise<Indication | undefined> {
  const all = await listIndications();
  return all.find((i) => i.id === id);
}
