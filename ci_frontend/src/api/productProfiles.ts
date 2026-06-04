import type { ProductProfile } from "@/types/domain";
import { MOCK_PRODUCT_PROFILES } from "@/lib/mockData";
import { mockDelay } from "./client";

export async function getProductProfile(cardId: string): Promise<ProductProfile | undefined> {
  return mockDelay(MOCK_PRODUCT_PROFILES.find((p) => p.cardId === cardId));
}
