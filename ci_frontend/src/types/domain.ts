export type Priority = "high" | "medium" | "low";

export type Phase = "Preclinical" | "Phase 1" | "Phase 2" | "Phase 3" | "Approved" | "Discontinued";

export const PHASES: readonly Phase[] = [
  "Preclinical",
  "Phase 1",
  "Phase 2",
  "Phase 3",
  "Approved",
  "Discontinued",
] as const;

export interface TherapeuticArea {
  id: string;
  name: string;
  description: string;
  indicationIds: string[];
}

export interface Indication {
  id: string;
  therapeuticAreaId: string;
  name: string;
  shortDescription: string;
}

export interface Article {
  id: string;
  indicationId: string;
  type: "news" | "social" | "publication";
  headline: string;
  source: string;
  sourceUrl: string;
  sourceLogoUrl?: string;
  publishedDate: string;
  priority: Priority;
  company: string;
  /** Markdown */
  keyHighlights: string;
}

/** All 15 fields */
export interface CompetitiveLandscapeCard {
  id: string;
  indicationId: string;
  competitor_asset: string;
  company: string;
  moa: string;
  roa: string;
  phase: Phase;
  sub_indication: string;
  priority: Priority;
  nct_id: string;
  start_date: string;
  primary_completion_date: string;
  expected_approval: string;
  trial_status: string;
  notes: string;
  source_url: string;
  last_updated: string;
}

export interface ProductProfile {
  id: string;
  cardId: string;
  /** Markdown */
  body: string;
}

export interface Competitor {
  id: string;
  name: string;
  logoUrl?: string;
  /** Markdown */
  financialsSummary: string;
}

export interface ClinicalTrial {
  nct_id: string;
  indicationId: string;
  study_name: string;
  company: string;
  phase: Phase;
  status: string;
  start_date: string;
  primary_completion: string;
  priority: Priority;
  /** Markdown */
  detailsMarkdown: string;
}

export interface Note {
  id: string;
  userId: string;
  indicationId: string;
  content: string;
  updatedAt: string;
}

export interface Feedback {
  id: string;
  userId: string;
  rating: number;
  message: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationKey: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ReportJob {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  dateFrom: string;
  dateTo: string;
  cardIds: string[];
  downloadUrl?: string;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  plan: "starter" | "growth" | "enterprise";
  status: "active" | "suspended";
  adminCount: number;
  createdAt: string;
}

export interface ManagedUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: "user" | "admin";
  active: boolean;
  therapeuticAreaIds: string[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  tab: string;
  action: string;
}
