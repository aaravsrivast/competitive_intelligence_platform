import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Building2, Loader2 } from "lucide-react";
import type { Competitor } from "@/types/domain";
import { getCompetitorFinancials, listCompetitors } from "@/api/competitors";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils";

export function CompetitorsGrid() {
  const query = useQuery({ queryKey: ["competitors"], queryFn: listCompetitors });

  return (
    <div className="overflow-y-auto p-6">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {query.isLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)
          : (query.data ?? []).map((c) => <CompanyCard key={c.id} company={c} />)}
      </div>
    </div>
  );
}

function CompanyCard({ company }: { company: Competitor }) {
  const [open, setOpen] = useState(false);
  const financialsQuery = useQuery({
    queryKey: ["competitor-financials", company.name],
    queryFn: () => getCompetitorFinancials(company.name),
    enabled: open,
    staleTime: 5 * 60_000,
  });

  const initials = company.name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const summary = financialsQuery.data ?? company.financialsSummary;

  return (
    <Card className="flex flex-col rounded-xl border-border bg-card p-5 shadow-elegant transition-shadow hover:shadow-card-hover">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-muted font-mono text-sm font-bold text-primary">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold tracking-tight text-card-foreground">{company.name}</h3>
          <p className="text-xs text-muted-foreground">
            <Building2 className="mr-1 inline h-3 w-3" />
            Pharmaceutical
          </p>
        </div>
      </div>
      <div className={cn("mt-4 transition-all", open ? "max-h-[1000px]" : "max-h-24 overflow-hidden")}>
        {financialsQuery.isLoading && open ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading financial summary…
          </div>
        ) : (
          <Markdown>{summary}</Markdown>
        )}
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-3 inline-flex items-center gap-1 self-start text-xs font-medium text-primary hover:underline"
      >
        {open ? (
          <>
            Show less <ChevronUp className="h-3 w-3" />
          </>
        ) : (
          <>
            Show more <ChevronDown className="h-3 w-3" />
          </>
        )}
      </button>
    </Card>
  );
}
