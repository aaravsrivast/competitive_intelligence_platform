import type { AuthUser, TenantUser } from "@/types/auth";
import type {
  Article,
  ChatMessage,
  ClinicalTrial,
  CompetitiveLandscapeCard,
  Feedback,
  Indication,
  LogEntry,
  ManagedUser,
  Note,
  Phase,
  Priority,
  ProductProfile,
  ReportJob,
  Tenant,
  TherapeuticArea,
} from "@/types/domain";

type Json = Record<string, unknown>;

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "tenant";
}

export function displayName(first?: string | null, last?: string | null, email?: string): string {
  const full = [first, last].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (email) {
    const local = email.split("@")[0] ?? email;
    return local.replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return "User";
}

export function mapProfileToAuthUser(doc: Json, fallbackEmail?: string): TenantUser {
  return {
    id: String(doc.id),
    email: String(doc.email ?? fallbackEmail ?? ""),
    name: displayName(doc.first_name as string, doc.last_name as string, String(doc.email ?? fallbackEmail)),
    role: doc.role === "admin" ? "admin" : "user",
    tenantId: String(doc.tenant_id ?? ""),
    therapeuticAreaIds: (doc.therapeutic_area_ids as string[]) ?? [],
    avatarUrl: doc.profile_photo_url as string | undefined,
  };
}

export function mapSuperadminUser(userId: string, email: string): AuthUser {
  return {
    id: userId,
    email,
    name: displayName(null, null, email),
    role: "superadmin",
  };
}

export function mapTherapeuticArea(doc: Json, indicationIds: string[]): TherapeuticArea {
  return {
    id: String(doc.id),
    name: String(doc.name),
    description: String(doc.description ?? ""),
    indicationIds,
  };
}

export function mapIndication(doc: Json): Indication {
  return {
    id: String(doc.id),
    therapeuticAreaId: String(doc.therapeutic_area_id),
    name: String(doc.name),
    shortDescription: String(doc.description ?? doc.code ?? ""),
  };
}

export function mapArticle(
  doc: Json,
  type: Article["type"],
  indicationIdFallback: string,
): Article {
  const meta = (doc.metadata as Json) ?? {};
  const indicationId = String(meta.indication_id ?? indicationIdFallback);
  return {
    id: String(doc.id),
    indicationId,
    type,
    headline: String(doc.title),
    source: String(meta.source ?? doc.company ?? "Source"),
    sourceUrl: String(doc.source_url ?? ""),
    sourceLogoUrl: meta.source_logo_url as string | undefined,
    publishedDate: String(doc.published_at ?? doc.posted_at ?? doc.created_at ?? ""),
    priority: normalizePriority(doc.priority),
    company: String(doc.company ?? ""),
    keyHighlights: String(doc.highlights ?? doc.content ?? ""),
  };
}

function normalizePriority(p: unknown): Priority {
  const v = String(p ?? "medium").toLowerCase();
  if (v === "high") return "high";
  if (v === "low") return "low";
  return "medium";
}

export function mapCLCard(doc: Json): CompetitiveLandscapeCard {
  const timeline = (doc.timeline as Json) ?? {};
  return {
    id: String(doc.id),
    indicationId: String(doc.indication_id),
    competitor_asset: String(doc.competitor_asset),
    company: String(doc.company),
    moa: String(doc.moa ?? ""),
    roa: String(doc.roa ?? ""),
    phase: String(doc.phase) as Phase,
    sub_indication: String(doc.sub_indication ?? ""),
    priority: normalizePriority(doc.priority),
    nct_id: String(doc.nct_id ?? ""),
    start_date: String(timeline.start_date ?? ""),
    primary_completion_date: String(timeline.primary_completion_date ?? ""),
    expected_approval: String(timeline.expected_approval ?? ""),
    trial_status: String(timeline.trial_status ?? ""),
    notes: String(doc.notes ?? ""),
    source_url: String(timeline.source_url ?? ""),
    last_updated: String(doc.updated_at ?? doc.created_at ?? ""),
  };
}

export function clPatchToBackend(patch: Partial<CompetitiveLandscapeCard>): Json {
  const body: Json = {};
  if (patch.company !== undefined) body.company = patch.company;
  if (patch.competitor_asset !== undefined) body.competitor_asset = patch.competitor_asset;
  if (patch.moa !== undefined) body.moa = patch.moa;
  if (patch.roa !== undefined) body.roa = patch.roa;
  if (patch.phase !== undefined) body.phase = patch.phase;
  if (patch.sub_indication !== undefined) body.sub_indication = patch.sub_indication;
  if (patch.priority !== undefined) body.priority = patch.priority;
  if (patch.nct_id !== undefined) body.nct_id = patch.nct_id;
  if (patch.notes !== undefined) body.notes = patch.notes;
  if (patch.indicationId !== undefined) body.indication_id = patch.indicationId;

  const timeline: Json = {};
  if (patch.start_date !== undefined) timeline.start_date = patch.start_date;
  if (patch.primary_completion_date !== undefined) timeline.primary_completion_date = patch.primary_completion_date;
  if (patch.expected_approval !== undefined) timeline.expected_approval = patch.expected_approval;
  if (patch.trial_status !== undefined) timeline.trial_status = patch.trial_status;
  if (patch.source_url !== undefined) timeline.source_url = patch.source_url;
  if (Object.keys(timeline).length) body.timeline = timeline;

  return body;
}

export function clCreateToBackend(card: Omit<CompetitiveLandscapeCard, "id" | "last_updated">): Json {
  return {
    company: card.company,
    competitor_asset: card.competitor_asset,
    indication_id: card.indicationId,
    phase: card.phase,
    roa: card.roa || undefined,
    moa: card.moa || undefined,
    sub_indication: card.sub_indication || undefined,
    priority: card.priority,
    nct_id: card.nct_id || undefined,
    notes: card.notes || undefined,
    timeline: {
      start_date: card.start_date || undefined,
      primary_completion_date: card.primary_completion_date || undefined,
      expected_approval: card.expected_approval || undefined,
      trial_status: card.trial_status || undefined,
      source_url: card.source_url || undefined,
    },
  };
}

export function mapProductProfile(doc: Json): ProductProfile {
  return {
    id: String(doc.id),
    cardId: String(doc.id),
    body: String(doc.profile_markdown ?? doc.product_profile ?? ""),
  };
}

export function mapClinicalTrial(doc: Json, indicationId = ""): ClinicalTrial {
  const payload = (doc.payload as Json) ?? {};
  const proto = (payload.protocolSection as Json) ?? {};
  const idMod = (proto.identificationModule as Json) ?? {};
  const statusMod = (proto.statusModule as Json) ?? {};
  const designMod = (proto.designModule as Json) ?? {};
  const sponsorMod = (proto.sponsorCollaboratorsModule as Json) ?? {};
  const lead = (sponsorMod.leadSponsor as Json) ?? {};

  const phases = designMod.phases as string[] | undefined;
  const phase = phases?.[0] ?? "Phase 1";

  return {
    nct_id: String(doc.nct_id),
    indicationId,
    study_name: String(idMod.briefTitle ?? idMod.officialTitle ?? doc.nct_id),
    company: String(lead.name ?? ""),
    phase: phase as Phase,
    status: String(statusMod.overallStatus ?? ""),
    start_date: String((statusMod.startDateStruct as Json)?.date ?? ""),
    primary_completion: String((statusMod.primaryCompletionDateStruct as Json)?.date ?? ""),
    priority: "medium",
    detailsMarkdown:
      typeof payload === "object"
        ? `### ${idMod.briefTitle ?? doc.nct_id}\n\n**Status:** ${statusMod.overallStatus ?? "—"}\n\n**Sponsor:** ${lead.name ?? "—"}`
        : String(payload),
  };
}

export function mapNote(doc: Json): Note {
  return {
    id: String(doc.id),
    userId: String(doc.user_id),
    indicationId: String(doc.context_id ?? ""),
    content: String(doc.body),
    updatedAt: String(doc.updated_at ?? doc.created_at ?? ""),
  };
}

export function mapFeedback(doc: Json): Feedback {
  return {
    id: String(doc.id),
    userId: String(doc.user_id),
    rating: Number(doc.rating ?? 0),
    message: String(doc.message),
    createdAt: String(doc.created_at ?? ""),
  };
}

export function mapChatMessage(doc: Json, conversationKey: string): ChatMessage {
  return {
    id: `${doc.created_at}-${doc.role}`,
    conversationKey,
    role: doc.role as "user" | "assistant",
    content: String(doc.content),
    createdAt: String(doc.created_at ?? ""),
  };
}

export function mapReport(doc: Json, meta?: { dateFrom?: string; dateTo?: string; cardIds?: string[] }): ReportJob {
  const pdf = doc.pdf_storage_path as string | undefined;
  return {
    id: String(doc.id),
    status: pdf ? "completed" : "processing",
    progress: pdf ? 100 : 50,
    dateFrom: meta?.dateFrom ?? "",
    dateTo: meta?.dateTo ?? "",
    cardIds: meta?.cardIds ?? [],
    downloadUrl: pdf,
    createdAt: String(doc.created_at ?? ""),
  };
}

export function mapTenant(doc: Json): Tenant {
  const settings = (doc.settings as Json) ?? {};
  const adminIds = (doc.admin_user_ids as string[]) ?? [];
  return {
    id: String(doc.id),
    name: String(doc.name),
    plan: (settings.plan as Tenant["plan"]) ?? "starter",
    status: (settings.status as Tenant["status"]) ?? "active",
    adminCount: adminIds.length,
    createdAt: String(doc.created_at ?? ""),
  };
}

export function tenantToSettings(t: Tenant): Json {
  return { plan: t.plan, status: t.status };
}

export function mapManagedUser(doc: Json, tenantId: string): ManagedUser {
  return {
    id: String(doc.id),
    tenantId: String(doc.tenant_id ?? tenantId),
    name: displayName(doc.first_name as string, doc.last_name as string, String(doc.email)),
    email: String(doc.email),
    role: doc.role === "admin" ? "admin" : "user",
    active: doc.active !== false,
    therapeuticAreaIds: (doc.therapeutic_area_ids as string[]) ?? [],
  };
}

export function mapLogEntry(doc: Json, userLabel?: string): LogEntry {
  return {
    id: String(doc.id),
    timestamp: String(doc.created_at ?? ""),
    user: userLabel ?? String(doc.user_id ?? "—"),
    tab: String(doc.tab ?? ""),
    action: String(doc.action ?? ""),
  };
}

export function parseConversationKey(key: string): { indicationId: string } {
  const parts = key.split(":");
  return { indicationId: parts.length > 1 ? parts[parts.length - 1]! : key };
}

export function isNewEntityId(id: string): boolean {
  return id.startsWith("tenant-") || id.startsWith("u-") || id.startsWith("cl-new-") || id.startsWith("note-");
}
