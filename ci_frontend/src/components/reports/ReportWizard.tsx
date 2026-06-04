import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { listCLCards } from "@/api/competitiveLandscape";
import { createReport, getReport } from "@/api/reports";
import type { ReportJob } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { PriorityBadge } from "@/components/articles/PriorityBadge";

interface ReportWizardProps {
  indicationId: string;
}

export function ReportWizard({ indicationId }: ReportWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [job, setJob] = useState<ReportJob | null>(null);

  const cardsQuery = useQuery({
    queryKey: ["cl", indicationId],
    queryFn: () => listCLCards(indicationId),
  });

  const createMut = useMutation({
    mutationFn: createReport,
    onSuccess: (j) => {
      setJob(j);
      setStep(3);
    },
  });

  // Poll while job is in flight.
  useEffect(() => {
    if (!job || job.status === "completed" || job.status === "failed") return;
    const id = window.setInterval(async () => {
      try {
        const next = await getReport(job.id);
        setJob(next);
        if (next.status === "completed") {
          window.clearInterval(id);
          toast.success("Report ready");
        }
      } catch {
        window.clearInterval(id);
      }
    }, 3000);
    return () => window.clearInterval(id);
  }, [job]);

  const cards = cardsQuery.data ?? [];
  const selectedCards = useMemo(() => cards.filter((c) => selectedIds.includes(c.id)), [cards, selectedIds]);
  const toggle = (id: string) => setSelectedIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="mx-auto h-full max-w-4xl overflow-y-auto px-8 py-8">
      <Stepper step={step} />

      {step === 1 && (
        <section className="mt-8 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Date range &amp; assets</h2>
            <p className="text-sm text-muted-foreground">Pick the reporting window and the competitor assets to include.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            <div>
              <Label>From</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>To</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1" />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Competitor assets ({selectedIds.length} selected)</Label>
              <div className="flex gap-2">
                <button onClick={() => setSelectedIds(cards.map((c) => c.id))} className="text-xs font-medium text-primary hover:underline">Select all</button>
                <button onClick={() => setSelectedIds([])} className="text-xs font-medium text-muted-foreground hover:underline">Clear</button>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card">
              {cardsQuery.isLoading ? (
                <div className="space-y-2 p-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <ul className="max-h-80 divide-y divide-border overflow-y-auto">
                  {cards.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                      <Checkbox id={`asset-${c.id}`} checked={selectedIds.includes(c.id)} onCheckedChange={() => toggle(c.id)} />
                      <Label htmlFor={`asset-${c.id}`} className="flex flex-1 cursor-pointer items-center justify-between gap-3 font-normal">
                        <div>
                          <p className="font-mono text-sm font-semibold">{c.competitor_asset}</p>
                          <p className="text-xs text-muted-foreground">{c.company} · {c.phase}</p>
                        </div>
                        <PriorityBadge priority={c.priority} />
                      </Label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={selectedIds.length === 0}>Next: Preview</Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="mt-8 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Review selection</h2>
            <p className="text-sm text-muted-foreground">{selectedCards.length} assets between {dateFrom} and {dateTo}.</p>
          </div>
          <div className="rounded-xl border border-border bg-card">
            <ul className="divide-y divide-border">
              {selectedCards.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div>
                    <p className="font-mono text-sm font-semibold">{c.competitor_asset}</p>
                    <p className="text-xs text-muted-foreground">{c.company} · {c.moa}</p>
                  </div>
                  <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs">{c.phase}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button
              onClick={() => createMut.mutate({ dateFrom, dateTo, cardIds: selectedIds })}
              disabled={createMut.isPending}
            >
              {createMut.isPending ? "Submitting..." : "Generate Report"}
            </Button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="mt-8 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Generating report</h2>
            <p className="text-sm text-muted-foreground">We poll status every 3 seconds. You can leave this tab — the job continues.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              {job?.status === "completed" ? (
                <Check className="h-5 w-5 text-success" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium capitalize text-foreground">{job?.status ?? "queued"}</p>
                <Progress value={job?.progress ?? 0} className="mt-2 h-2" />
              </div>
              <span className="font-mono text-sm tabular-nums text-muted-foreground">{job?.progress ?? 0}%</span>
            </div>
            {job?.status === "completed" && job.downloadUrl && (
              <Button asChild className="mt-4">
                <a href={job.downloadUrl} target="_blank" rel="noreferrer">
                  <Download className="mr-1.5 h-4 w-4" />
                  Download PDF
                </a>
              </Button>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => { setStep(1); setJob(null); }}>Start new report</Button>
          </div>
        </section>
      )}
    </div>
  );
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Range & assets" },
    { n: 2, label: "Preview" },
    { n: 3, label: "Generate" },
  ];
  return (
    <ol className="flex items-center gap-2">
      {steps.map((s, i) => (
        <li key={s.n} className="flex flex-1 items-center gap-2">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
              step >= s.n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {step > s.n ? <Check className="h-3.5 w-3.5" /> : s.n}
          </div>
          <span className={cn("text-xs font-medium", step >= s.n ? "text-foreground" : "text-muted-foreground")}>
            {s.label}
          </span>
          {i < steps.length - 1 && <div className={cn("h-px flex-1", step > s.n ? "bg-primary" : "bg-border")} />}
        </li>
      ))}
    </ol>
  );
}
