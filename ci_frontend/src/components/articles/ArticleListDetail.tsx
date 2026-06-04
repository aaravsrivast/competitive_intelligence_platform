import { useMemo, useState } from "react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ExternalLink, Mail, Download, Filter, X, Search, FileText } from "lucide-react";
import type { Article, Priority } from "@/types/domain";
import { useFilterStore, type ArticleFilters } from "@/store/filterStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { PriorityBadge } from "./PriorityBadge";
import { toast } from "sonner";

interface ArticleListDetailProps {
  indicationId: string;
  tabKey: "news" | "social" | "publications";
  articles: Article[];
  isLoading: boolean;
}

export function ArticleListDetail({ indicationId, tabKey, articles, isLoading }: ArticleListDetailProps) {
  const filterKey = `${indicationId}:${tabKey}`;
  const filters = useFilterStore((s) => s.getArticleFilters(filterKey));
  const setFilters = useFilterStore((s) => s.setArticleFilters);
  const resetFilters = useFilterStore((s) => s.resetArticleFilters);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allCompanies = useMemo(
    () => Array.from(new Set(articles.map((a) => a.company))).sort(),
    [articles],
  );

  const filtered = useMemo(() => filterArticles(articles, filters), [articles, filters]);

  const selected =
    filtered.find((a) => a.id === selectedId) ?? (filtered.length > 0 ? filtered[0] : null);

  const activeFilterCount =
    filters.priorities.length + filters.companies.length + (filters.dateFrom || filters.dateTo ? 1 : 0);

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[minmax(360px,40%)_1fr]">
      {/* List panel */}
      <div className="flex min-h-0 flex-col border-r border-border bg-card/30">
        <div className="space-y-2.5 border-b border-border p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search headlines..."
              value={filters.search}
              onChange={(e) => setFilters(filterKey, { search: e.target.value })}
              className="h-9 pl-8"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <PriorityFilter
              value={filters.priorities}
              onChange={(priorities) => setFilters(filterKey, { priorities })}
            />
            <CompanyFilter
              all={allCompanies}
              value={filters.companies}
              onChange={(companies) => setFilters(filterKey, { companies })}
            />
            <DateFilter
              from={filters.dateFrom}
              to={filters.dateTo}
              onChange={(dateFrom, dateTo) => setFilters(filterKey, { dateFrom, dateTo })}
            />
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => resetFilters(filterKey)}
                className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>

          <p className="font-mono text-[11px] text-muted-foreground">
            {isLoading ? "Loading..." : `${filtered.length} of ${articles.length} articles`}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ArticleCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-full items-center justify-center p-8 text-center">
              <p className="text-sm text-muted-foreground">No articles match your filters.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((a) => (
                <li key={a.id}>
                  <ArticleCard
                    article={a}
                    active={selected?.id === a.id}
                    onClick={() => setSelectedId(a.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Detail panel */}
      <div className="min-h-0 overflow-y-auto bg-background">
        {selected ? <ArticleDetailPane article={selected} /> : <EmptyDetail />}
      </div>
    </div>
  );
}

interface ArticleCardProps {
  article: Article;
  active: boolean;
  onClick: () => void;
}

function ArticleCard({ article, active, onClick }: ArticleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "block w-full border-l-2 px-4 py-3 text-left transition-colors hover:bg-accent/40",
        active ? "border-l-primary bg-accent/60" : "border-l-transparent",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-card-foreground">
          {article.headline}
        </h3>
        <PriorityBadge priority={article.priority} />
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground/80">{article.company}</span>
        <span>·</span>
        <span>{article.source}</span>
        <span>·</span>
        <time dateTime={article.publishedDate} className="font-mono">
          {format(new Date(article.publishedDate), "MMM d, yyyy")}
        </time>
      </div>
    </button>
  );
}

function ArticleCardSkeleton() {
  return (
    <div className="space-y-2 rounded-lg p-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

function ArticleDetailPane({ article }: { article: Article }) {
  return (
    <article className="mx-auto max-w-3xl px-8 py-8">
      <div className="flex flex-wrap items-center gap-2">
        <PriorityBadge priority={article.priority} />
        <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {article.company}
        </span>
        <time className="font-mono text-xs text-muted-foreground" dateTime={article.publishedDate}>
          {format(new Date(article.publishedDate), "MMMM d, yyyy")}
        </time>
      </div>

      <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-foreground">
        {article.headline}
      </h2>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href={article.sourceUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            View source · {article.source}
          </a>
        </Button>
        <Button variant="outline" size="sm" onClick={() => toast.success("Article emailed")}>
          <Mail className="mr-1.5 h-3.5 w-3.5" />
          Email
        </Button>
        <Button variant="outline" size="sm" onClick={() => toast.success("Article downloaded")}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Download
        </Button>
      </div>

      <div className="markdown-body mt-6 text-sm leading-relaxed text-foreground/90 [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:mb-1 [&_p]:my-2 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:my-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.keyHighlights}</ReactMarkdown>
      </div>
    </article>
  );
}

function EmptyDetail() {
  return (
    <div className="flex h-full items-center justify-center p-12">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <FileText className="h-5 w-5" />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Select an article to view details.</p>
      </div>
    </div>
  );
}

/* ─── Filters ──────────────────────────────────────────────── */

const PRIORITY_OPTS: { value: Priority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

function PriorityFilter({
  value,
  onChange,
}: {
  value: Priority[];
  onChange: (v: Priority[]) => void;
}) {
  const toggle = (p: Priority) => {
    onChange(value.includes(p) ? value.filter((x) => x !== p) : [...value, p]);
  };
  return (
    <FilterChip label="Priority" count={value.length}>
      <div className="space-y-2">
        {PRIORITY_OPTS.map((opt) => (
          <div key={opt.value} className="flex items-center gap-2">
            <Checkbox
              id={`prio-${opt.value}`}
              checked={value.includes(opt.value)}
              onCheckedChange={() => toggle(opt.value)}
            />
            <Label htmlFor={`prio-${opt.value}`} className="cursor-pointer text-sm font-normal">
              {opt.label}
            </Label>
          </div>
        ))}
      </div>
    </FilterChip>
  );
}

function CompanyFilter({
  all,
  value,
  onChange,
}: {
  all: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (c: string) => {
    onChange(value.includes(c) ? value.filter((x) => x !== c) : [...value, c]);
  };
  return (
    <FilterChip label="Company" count={value.length}>
      <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
        {all.map((c) => (
          <div key={c} className="flex items-center gap-2">
            <Checkbox
              id={`co-${c}`}
              checked={value.includes(c)}
              onCheckedChange={() => toggle(c)}
            />
            <Label htmlFor={`co-${c}`} className="cursor-pointer text-sm font-normal">
              {c}
            </Label>
          </div>
        ))}
      </div>
    </FilterChip>
  );
}

function DateFilter({
  from,
  to,
  onChange,
}: {
  from?: string;
  to?: string;
  onChange: (from?: string, to?: string) => void;
}) {
  const isActive = !!(from || to);
  return (
    <FilterChip label="Date" count={isActive ? 1 : 0}>
      <div className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground">From</Label>
          <Input
            type="date"
            value={from ?? ""}
            onChange={(e) => onChange(e.target.value || undefined, to)}
            className="mt-1 h-8"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">To</Label>
          <Input
            type="date"
            value={to ?? ""}
            onChange={(e) => onChange(from, e.target.value || undefined)}
            className="mt-1 h-8"
          />
        </div>
      </div>
    </FilterChip>
  );
}

function FilterChip({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium transition-colors hover:bg-accent",
            count > 0 && "border-primary bg-primary-muted text-primary hover:bg-primary-muted",
          )}
        >
          <Filter className="h-3 w-3" />
          {label}
          {count > 0 && (
            <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        {children}
      </PopoverContent>
    </Popover>
  );
}

function filterArticles(articles: Article[], f: ArticleFilters): Article[] {
  const q = f.search.trim().toLowerCase();
  return articles.filter((a) => {
    if (q && !a.headline.toLowerCase().includes(q) && !a.company.toLowerCase().includes(q)) return false;
    if (f.priorities.length > 0 && !f.priorities.includes(a.priority)) return false;
    if (f.companies.length > 0 && !f.companies.includes(a.company)) return false;
    if (f.dateFrom && a.publishedDate < f.dateFrom) return false;
    if (f.dateTo && a.publishedDate > new Date(f.dateTo + "T23:59:59").toISOString()) return false;
    return true;
  });
}
