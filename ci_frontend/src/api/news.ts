import type { Article } from "@/types/domain";
import { apiFetchPaginated } from "./client";
import { mapArticle } from "./mappers";

function filterByIndication(articles: Article[], indicationId: string): Article[] {
  return articles.filter(
    (a) => a.indicationId === indicationId || !a.indicationId || a.indicationId === indicationId,
  );
}

export async function listNews(indicationId: string): Promise<Article[]> {
  const docs = await apiFetchPaginated<Record<string, unknown>>("/news", { limit: 200 });
  const mapped = docs.map((d) => mapArticle(d, "news", indicationId));
  const filtered = mapped.filter(
    (a) =>
      a.indicationId === indicationId ||
      !(docs.find((x) => x.id === a.id)?.metadata as Record<string, unknown>)?.indication_id,
  );
  return filtered.length ? filtered : mapped;
}

export async function listSocial(indicationId: string): Promise<Article[]> {
  const docs = await apiFetchPaginated<Record<string, unknown>>("/social-media", { limit: 200 });
  const mapped = docs.map((d) => mapArticle(d, "social", indicationId));
  return filterByIndication(mapped, indicationId).length
    ? filterByIndication(mapped, indicationId)
    : mapped;
}

export async function listPublications(indicationId: string): Promise<Article[]> {
  const docs = await apiFetchPaginated<Record<string, unknown>>("/publications", { limit: 200 });
  const mapped = docs.map((d) => mapArticle(d, "publication", indicationId));
  return filterByIndication(mapped, indicationId).length
    ? filterByIndication(mapped, indicationId)
    : mapped;
}
