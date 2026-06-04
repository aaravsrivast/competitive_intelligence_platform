import type { Article } from "@/types/domain";
import { MOCK_ARTICLES } from "@/lib/mockData";
import { mockDelay } from "./client";

export async function listNews(indicationId: string): Promise<Article[]> {
  return mockDelay(MOCK_ARTICLES.filter((a) => a.indicationId === indicationId && a.type === "news"));
}

export async function listSocial(indicationId: string): Promise<Article[]> {
  return mockDelay(MOCK_ARTICLES.filter((a) => a.indicationId === indicationId && a.type === "social"));
}

export async function listPublications(indicationId: string): Promise<Article[]> {
  return mockDelay(MOCK_ARTICLES.filter((a) => a.indicationId === indicationId && a.type === "publication"));
}
