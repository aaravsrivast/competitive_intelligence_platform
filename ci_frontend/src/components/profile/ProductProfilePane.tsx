import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { listCLCards } from "@/api/competitiveLandscape";
import { getProductProfile } from "@/api/productProfiles";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PriorityBadge } from "@/components/articles/PriorityBadge";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils";

interface ProductProfilePaneProps {
  indicationId: string;
}

export function ProductProfilePane({ indicationId }: ProductProfilePaneProps) {
  const cardsQuery = useQuery({
    queryKey: ["cl", indicationId],
    queryFn: () => listCLCards(indicationId),
  });
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const all = cardsQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (c) =>
        c.competitor_asset.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.moa.toLowerCase().includes(q),
    );
  }, [cardsQuery.data, search]);

  const selected = filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? null;

  const profileQuery = useQuery({
    queryKey: ["productProfile", selected?.id],
    queryFn: () => (selected ? getProductProfile(selected.id) : Promise.resolve(undefined)),
    enabled: !!selected,
  });

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[minmax(320px,36%)_1fr]">
      <div className="flex min-h-0 flex-col border-r border-border bg-card/30">
        <div className="border-b border-border p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets, companies, MoA..."
              className="h-9 pl-8"
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {cardsQuery.isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      "block w-full border-l-2 px-4 py-3 text-left transition-colors hover:bg-accent/40",
                      selected?.id === c.id ? "border-l-primary bg-accent/60" : "border-l-transparent",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-sm font-semibold">{c.competitor_asset}</span>
                      <PriorityBadge priority={c.priority} />
                    </div>
                    <p className="mt-0.5 text-xs font-medium text-foreground/80">{c.company}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.phase} · {c.sub_indication}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="min-h-0 overflow-y-auto bg-background">
        {!selected ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">Select an asset to view its profile.</p>
            </div>
          </div>
        ) : (
          <article className="mx-auto max-w-3xl px-8 py-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border bg-card px-2 py-0.5 font-mono text-xs">{selected.phase}</span>
              <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs">{selected.sub_indication}</span>
              <PriorityBadge priority={selected.priority} />
            </div>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                  {selected.competitor_asset}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{selected.company} · {selected.moa}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.success("Profile downloaded")}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Download PDF
              </Button>
            </div>
            <div className="mt-6">
              {profileQuery.isLoading || !profileQuery.data ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : (
                <Markdown>{profileQuery.data.body}</Markdown>
              )}
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
