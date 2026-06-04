import type { ReportJob } from "@/types/domain";
import { apiFetch } from "./client";
import { mapReport } from "./mappers";

const reportMeta = new Map<string, { dateFrom: string; dateTo: string; cardIds: string[] }>();

export async function createReport(input: {
  dateFrom: string;
  dateTo: string;
  cardIds: string[];
}): Promise<ReportJob> {
  const doc = await apiFetch<Record<string, unknown>>("/reports/generate", {
    method: "POST",
    body: {
      title: `Competitive landscape report (${input.dateFrom} – ${input.dateTo})`,
      payload: {
        date_from: input.dateFrom,
        date_to: input.dateTo,
        card_ids: input.cardIds,
        sections: [{ heading: "Summary", body: "Generated from selected competitor assets." }],
        rows: input.cardIds.map((id) => ({ card_id: id })),
      },
    },
  });
  const id = String(doc.id);
  reportMeta.set(id, input);
  return mapReport(doc, input);
}

export async function getReport(id: string): Promise<ReportJob> {
  const doc = await apiFetch<Record<string, unknown>>(`/reports/${id}`);
  return mapReport(doc, reportMeta.get(id));
}
