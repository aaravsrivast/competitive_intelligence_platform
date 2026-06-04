import type { ReportJob } from "@/types/domain";
import { mockDelay } from "./client";

const jobs = new Map<string, ReportJob>();

export async function createReport(input: { dateFrom: string; dateTo: string; cardIds: string[] }): Promise<ReportJob> {
  const job: ReportJob = {
    id: `rpt-${Date.now()}`,
    status: "queued",
    progress: 0,
    dateFrom: input.dateFrom,
    dateTo: input.dateTo,
    cardIds: input.cardIds,
    createdAt: new Date().toISOString(),
  };
  jobs.set(job.id, job);
  return mockDelay(job, 200);
}

export async function getReport(id: string): Promise<ReportJob> {
  const existing = jobs.get(id);
  if (!existing) throw new Error("Report not found");
  // Simulate progression on every poll.
  let next: ReportJob = existing;
  if (existing.status === "queued") {
    next = { ...existing, status: "processing", progress: 25 };
  } else if (existing.status === "processing") {
    const progress = Math.min(100, existing.progress + 30);
    next = progress >= 100
      ? { ...existing, status: "completed", progress: 100, downloadUrl: "https://example.com/report.pdf" }
      : { ...existing, progress };
  }
  jobs.set(id, next);
  return mockDelay(next, 200);
}
