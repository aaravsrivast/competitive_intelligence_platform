import { create } from "zustand";
import type { Phase, Priority } from "@/types/domain";

export interface ArticleFilters {
  search: string;
  priorities: Priority[];
  companies: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface CLFilters {
  companies: string[];
  phases: Phase[];
  subIndications: string[];
  priority?: Priority;
}

interface FilterState {
  articleFilters: Record<string, ArticleFilters>; // keyed by `${indicationId}:${tab}`
  clFilters: Record<string, CLFilters>;
  getArticleFilters: (key: string) => ArticleFilters;
  setArticleFilters: (key: string, patch: Partial<ArticleFilters>) => void;
  resetArticleFilters: (key: string) => void;
  getCLFilters: (key: string) => CLFilters;
  setCLFilters: (key: string, patch: Partial<CLFilters>) => void;
}

const DEFAULT_ARTICLE_FILTERS: ArticleFilters = {
  search: "",
  priorities: [],
  companies: [],
};

const DEFAULT_CL_FILTERS: CLFilters = {
  companies: [],
  phases: [],
  subIndications: [],
};

export const useFilterStore = create<FilterState>()((set, get) => ({
  articleFilters: {},
  clFilters: {},
  getArticleFilters: (key) => get().articleFilters[key] ?? DEFAULT_ARTICLE_FILTERS,
  setArticleFilters: (key, patch) =>
    set((state) => ({
      articleFilters: {
        ...state.articleFilters,
        [key]: { ...(state.articleFilters[key] ?? DEFAULT_ARTICLE_FILTERS), ...patch },
      },
    })),
  resetArticleFilters: (key) =>
    set((state) => ({
      articleFilters: { ...state.articleFilters, [key]: DEFAULT_ARTICLE_FILTERS },
    })),
  getCLFilters: (key) => get().clFilters[key] ?? DEFAULT_CL_FILTERS,
  setCLFilters: (key, patch) =>
    set((state) => ({
      clFilters: {
        ...state.clFilters,
        [key]: { ...(state.clFilters[key] ?? DEFAULT_CL_FILTERS), ...patch },
      },
    })),
}));
