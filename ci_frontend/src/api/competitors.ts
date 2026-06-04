import type { Competitor } from "@/types/domain";
import { apiFetch } from "./client";

export async function listCompetitors(): Promise<Competitor[]> {
  const data = await apiFetch<{ companies: string[] }>("/competitors");
  return (data.companies ?? []).map((name, i) => ({
    id: `co-${i}-${name}`,
    name,
    financialsSummary: "_Expand to load financial summary._",
  }));
}

export async function getCompetitorFinancials(company: string): Promise<string> {
  const data = await apiFetch<{ financials?: { financials_markdown: string } }>(
    `/competitors?company=${encodeURIComponent(company)}`,
  );
  return data.financials?.financials_markdown ?? "No financial data available.";
}
