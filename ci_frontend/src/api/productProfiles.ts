import type { ProductProfile } from "@/types/domain";
import { apiFetch } from "./client";
import { mapProductProfile } from "./mappers";

export async function getProductProfile(cardId: string): Promise<ProductProfile | undefined> {
  try {
    const doc = await apiFetch<Record<string, unknown>>(`/product-profiles/${cardId}`);
    return mapProductProfile(doc);
  } catch {
    return undefined;
  }
}
