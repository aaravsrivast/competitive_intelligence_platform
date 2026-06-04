import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import type { CompetitiveLandscapeCard, Phase, Priority } from "@/types/domain";
import { PHASES } from "@/types/domain";
import { listCLCards } from "@/api/competitiveLandscape";
import { COMPANIES } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PriorityBadge } from "@/components/articles/PriorityBadge";
import { cn } from "@/lib/utils";

interface TimelineProps {
  indicationId: string;
}

interface Quarter {
  year: number;
  q: 1 | 2 | 3 | 4;
  startISO: string;
  endISO: string;
  label: string;
}

const QUARTERS_PER_VIEW = 8;
const TOTAL_YEARS = 20;

function buildQuarters(): Quarter[] {
  const now = new Date();
  const startYear = now.getFullYear();
  const startQ = (Math.floor(now.getMonth() / 3) + 1) as 1 | 2 | 3 | 4;
  const out: Quarter[] = [];
  let y = startYear;
  let q = startQ;
  for (let i = 0; i < TOTAL_YEARS * 4; i++) {
    const startMonth = (q - 1) * 3;
    const start = new Date(y, startMonth, 1);
    const end = new Date(y, startMonth + 3, 0);
    out.push({
      year: y,
      q,
      startISO: start.toISOString().slice(0, 10),
      endISO: end.toISOString().slice(0, 10),
      label: `Q${q} ${y}`,
    });
    q = (q === 4 ? 1 : q + 1) as 1 | 2 | 3 | 4;
    if (q === 1) y += 1;
  }
  return out;
}

export function Timeline({ indicationId }: TimelineProps) {
  const cardsQuery = useQuery({ queryKey: ["cl", indicationId], queryFn: () => listCLCards(indicationId) });
  const [offset, setOffset] = useState(0);
  const [company, setCompany] = useState<string>("any");
  const [phase, setPhase] = useState<string>("any");
  const [priority, setPriority] = useState<string>("any");

  const quarters = useMemo(buildQuarters, []);
  const visibleQuarters = quarters.slice(offset, offset + QUARTERS_PER_VIEW);

  const filteredCards = useMemo(() => {
    return (cardsQuery.data ?? []).filter((c) => {
      if (company !== "any" && c.company !== company) return false;
      if (phase !== "any" && c.phase !== phase) return false;
      if (priority !== "any" && c.priority !== priority) return false;
      return !!c.expected_approval;
    });
  }, [cardsQuery.data, company, phase, priority]);

  const cardsByQuarter = useMemo(() => {
    const map = new Map<string, CompetitiveLandscapeCard[]>();
    for (const c of filteredCards) {
      const q = quarters.find((q) => c.expected_approval >= q.startISO && c.expected_approval <= q.endISO);
      if (!q) continue;
      const key = `${q.year}-Q${q.q}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return map;
  }, [filteredCards, quarters]);

  const canPrev = offset > 0;
  const canNext = offset + QUARTERS_PER_VIEW < quarters.length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card/30 px-6 py-3">
        <Select value={company} onValueChange={setCompany}>
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Company" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">All companies</SelectItem>
            {COMPANIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={phase} onValueChange={setPhase}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Phase" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">All phases</SelectItem>
            {PHASES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any priority</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setOffset(Math.max(0, offset - QUARTERS_PER_VIEW))} disabled={!canPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-mono text-xs text-muted-foreground">
            {visibleQuarters[0]?.label} – {visibleQuarters[visibleQuarters.length - 1]?.label}
          </span>
          <Button variant="outline" size="sm" onClick={() => setOffset(Math.min(quarters.length - QUARTERS_PER_VIEW, offset + QUARTERS_PER_VIEW))} disabled={!canNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-6">
        {cardsQuery.isLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : (
          <div className="grid h-full grid-cols-8 gap-2">
            {visibleQuarters.map((q) => {
              const items = cardsByQuarter.get(`${q.year}-Q${q.q}`) ?? [];
              return (
                <div key={`${q.year}-${q.q}`} className="flex flex-col rounded-xl border border-border bg-card/40 p-2">
                  <div className="border-b border-border pb-1.5 text-center">
                    <p className="font-mono text-xs font-semibold text-foreground">Q{q.q}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{q.year}</p>
                  </div>
                  <div className="mt-2 flex flex-1 flex-col gap-1.5 overflow-y-auto">
                    {items.length === 0 ? (
                      <div className="flex flex-1 items-center justify-center">
                        <Calendar className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                    ) : (
                      items.map((c) => <MilestoneChip key={c.id} card={c} />)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MilestoneChip({ card }: { card: CompetitiveLandscapeCard }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "rounded-md border border-border bg-card p-1.5 text-left text-[11px] transition-colors hover:border-primary",
            card.priority === "high" && "border-l-2 border-l-destructive",
            card.priority === "medium" && "border-l-2 border-l-warning",
          )}
        >
          <p className="truncate font-mono font-semibold">{card.competitor_asset}</p>
          <p className="truncate text-[10px] text-muted-foreground">{card.company}</p>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-sm font-semibold">{card.competitor_asset}</p>
            <p className="text-xs font-medium text-foreground/80">{card.company}</p>
          </div>
          <PriorityBadge priority={card.priority} />
        </div>
        <dl className="mt-3 space-y-1.5 text-xs">
          <Row label="Phase" value={card.phase} />
          <Row label="MoA" value={card.moa} />
          <Row label="RoA" value={card.roa} />
          <Row label="Sub-indication" value={card.sub_indication} />
          <Row label="Trial" value={card.nct_id} mono />
          <Row label="Status" value={card.trial_status} />
          <Row label="Approval" value={card.expected_approval} mono />
        </dl>
      </PopoverContent>
    </Popover>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("text-foreground/90", mono && "font-mono")}>{value}</dd>
    </div>
  );
}

// Suppress unused-warning from generic priority union (kept for module clarity).
export type { Priority };
