import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, RefreshCw, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import type { ClinicalTrial, Phase, Priority } from "@/types/domain";
import { PHASES } from "@/types/domain";
import { listTrials, syncTrial } from "@/api/clinicalTrials";
import { COMPANIES } from "@/lib/mockData";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PriorityBadge } from "@/components/articles/PriorityBadge";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface TrialsTableProps {
  indicationId: string;
}

type SortKey = keyof Pick<ClinicalTrial, "nct_id" | "study_name" | "company" | "phase" | "status" | "start_date" | "primary_completion" | "priority">;

interface SortState {
  key: SortKey;
  dir: "asc" | "desc";
}

export function TrialsTable({ indicationId }: TrialsTableProps) {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const qc = useQueryClient();

  const trialsQuery = useQuery({
    queryKey: ["trials", indicationId],
    queryFn: () => listTrials(indicationId),
  });

  const [company, setCompany] = useState<string>("any");
  const [phase, setPhase] = useState<string>("any");
  const [priority, setPriority] = useState<string>("any");
  const [sort, setSort] = useState<SortState>({ key: "start_date", dir: "desc" });
  const [expanded, setExpanded] = useState<string | null>(null);

  const syncMut = useMutation({
    mutationFn: syncTrial,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["trials", indicationId] });
      toast.success("Trial synced from ClinicalTrials.gov");
    },
  });

  const filtered = useMemo(() => {
    const all = trialsQuery.data ?? [];
    return all.filter((t) => {
      if (company !== "any" && t.company !== company) return false;
      if (phase !== "any" && t.phase !== phase) return false;
      if (priority !== "any" && t.priority !== priority) return false;
      return true;
    });
  }, [trialsQuery.data, company, phase, priority]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sort]);

  const toggleSort = (key: SortKey) => {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  };

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

        <p className="ml-auto font-mono text-xs text-muted-foreground">{sorted.length} trials</p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-card/95 text-xs uppercase tracking-wider text-muted-foreground backdrop-blur">
            <tr className="border-b border-border">
              <th className="w-8 px-3 py-2.5"></th>
              <SortHeader label="NCT ID" k="nct_id" sort={sort} onSort={toggleSort} />
              <SortHeader label="Study" k="study_name" sort={sort} onSort={toggleSort} />
              <SortHeader label="Company" k="company" sort={sort} onSort={toggleSort} />
              <SortHeader label="Phase" k="phase" sort={sort} onSort={toggleSort} />
              <SortHeader label="Status" k="status" sort={sort} onSort={toggleSort} />
              <SortHeader label="Start" k="start_date" sort={sort} onSort={toggleSort} />
              <SortHeader label="Completion" k="primary_completion" sort={sort} onSort={toggleSort} />
              <SortHeader label="Priority" k="priority" sort={sort} onSort={toggleSort} />
              {isAdmin && <th className="px-3 py-2.5 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {trialsQuery.isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td colSpan={isAdmin ? 10 : 9} className="px-3 py-3"><Skeleton className="h-5 w-full" /></td>
                </tr>
              ))
            ) : (
              sorted.map((t) => (
                <RowGroup
                  key={t.nct_id}
                  trial={t}
                  expanded={expanded === t.nct_id}
                  onToggle={() => setExpanded(expanded === t.nct_id ? null : t.nct_id)}
                  isAdmin={isAdmin}
                  onSync={() => syncMut.mutate(t.nct_id)}
                  syncing={syncMut.isPending && syncMut.variables === t.nct_id}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface SortHeaderProps {
  label: string;
  k: SortKey;
  sort: SortState;
  onSort: (k: SortKey) => void;
}

function SortHeader({ label, k, sort, onSort }: SortHeaderProps) {
  const Icon = sort.key !== k ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className="px-3 py-2.5 text-left">
      <button
        onClick={() => onSort(k)}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {label}
        <Icon className="h-3 w-3" />
      </button>
    </th>
  );
}

interface RowGroupProps {
  trial: ClinicalTrial;
  expanded: boolean;
  onToggle: () => void;
  isAdmin: boolean;
  onSync: () => void;
  syncing: boolean;
}

function RowGroup({ trial, expanded, onToggle, isAdmin, onSync, syncing }: RowGroupProps) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={cn("cursor-pointer border-b border-border transition-colors hover:bg-accent/40", expanded && "bg-accent/40")}
      >
        <td className="px-3 py-2.5">
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </td>
        <td className="px-3 py-2.5 font-mono text-xs">{trial.nct_id}</td>
        <td className="px-3 py-2.5">{trial.study_name}</td>
        <td className="px-3 py-2.5 font-medium">{trial.company}</td>
        <td className="px-3 py-2.5">{trial.phase}</td>
        <td className="px-3 py-2.5 text-xs">{trial.status}</td>
        <td className="px-3 py-2.5 font-mono text-xs">{format(new Date(trial.start_date), "yyyy-MM-dd")}</td>
        <td className="px-3 py-2.5 font-mono text-xs">{format(new Date(trial.primary_completion), "yyyy-MM-dd")}</td>
        <td className="px-3 py-2.5"><PriorityBadge priority={trial.priority} /></td>
        {isAdmin && (
          <td className="px-3 py-2.5 text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onSync(); }}
              disabled={syncing}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
              <span className="sr-only">Sync</span>
            </Button>
          </td>
        )}
      </tr>
      {expanded && (
        <tr className="border-b border-border bg-card/30">
          <td colSpan={isAdmin ? 10 : 9} className="px-6 py-4">
            <Markdown>{trial.detailsMarkdown}</Markdown>
          </td>
        </tr>
      )}
    </>
  );
}

// Re-export priority for external typing if needed.
export type { Priority };
