import type { LogEntry } from "@/types/domain";
import { MOCK_LOGS } from "@/lib/mockData";
import { mockDelay } from "./client";

export async function listLogs(): Promise<LogEntry[]> {
  return mockDelay(MOCK_LOGS);
}
