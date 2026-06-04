import type { LogEntry } from "@/types/domain";
import { apiFetchPaginated } from "./client";
import { mapLogEntry } from "./mappers";

export async function listLogs(): Promise<LogEntry[]> {
  const docs = await apiFetchPaginated<Record<string, unknown>>("/logs", { limit: 500 });
  return docs.map((d) => mapLogEntry(d));
}
