import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Plus, Pencil, Filter, X } from "lucide-react";
import { toast } from "sonner";
import type { CompetitiveLandscapeCard, Phase, Priority } from "@/types/domain";
import { PHASES } from "@/types/domain";
import { listCLCards, moveCLCard, createCLCard, updateCLCard } from "@/api/competitiveLandscape";
import { useAuth } from "@/hooks/useAuth";
import { useUiStore } from "@/store/uiStore";
import { useFilterStore } from "@/store/filterStore";
import { COMPANIES } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PriorityBadge } from "@/components/articles/PriorityBadge";
import { cn } from "@/lib/utils";
import { CLCardModal } from "./CLCardModal";
import { AddCLCardModal } from "./AddCLCardModal";

interface KanbanBoardProps {
  indicationId: string;
}

export function KanbanBoard({ indicationId }: KanbanBoardProps) {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const editMode = useUiStore((s) => s.editMode);
  const setEditMode = useUiStore((s) => s.setEditMode);
  const filterKey = `cl:${indicationId}`;
  const filters = useFilterStore((s) => s.getCLFilters(filterKey));
  const setFilters = useFilterStore((s) => s.setCLFilters);

  const qc = useQueryClient();
  const cardsQuery = useQuery({
    queryKey: ["cl", indicationId],
    queryFn: () => listCLCards(indicationId),
  });

  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const moveMut = useMutation({
    mutationFn: (input: { id: string; phase: Phase }) => moveCLCard(input.id, input.phase),
    onMutate: async ({ id, phase }) => {
      await qc.cancelQueries({ queryKey: ["cl", indicationId] });
      const prev = qc.getQueryData<CompetitiveLandscapeCard[]>(["cl", indicationId]);
      qc.setQueryData<CompetitiveLandscapeCard[]>(["cl", indicationId], (old = []) =>
        old.map((c) => (c.id === id ? { ...c, phase } : c)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["cl", indicationId], ctx.prev);
      toast.error("Failed to move card");
    },
    onSuccess: () => toast.success("Card moved"),
  });

  const updateMut = useMutation({
    mutationFn: (input: { id: string; patch: Partial<CompetitiveLandscapeCard> }) =>
      updateCLCard(input.id, input.patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["cl", indicationId] });
      toast.success("Card updated");
    },
  });

  const createMut = useMutation({
    mutationFn: createCLCard,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["cl", indicationId] });
      toast.success("Card added");
      setAddOpen(false);
    },
  });

  const filtered = useMemo(() => {
    const all = cardsQuery.data ?? [];
    return all.filter((c) => {
      if (filters.companies.length && !filters.companies.includes(c.company)) return false;
      if (filters.phases.length && !filters.phases.includes(c.phase)) return false;
      if (filters.subIndications.length && !filters.subIndications.includes(c.sub_indication)) return false;
      if (filters.priority && c.priority !== filters.priority) return false;
      return true;
    });
  }, [cardsQuery.data, filters]);

  const subIndications = useMemo(
    () => Array.from(new Set((cardsQuery.data ?? []).map((c) => c.sub_indication))).sort(),
    [cardsQuery.data],
  );

  const grouped = useMemo(() => {
    const map = new Map<Phase, CompetitiveLandscapeCard[]>();
    for (const phase of PHASES) map.set(phase, []);
    for (const card of filtered) map.get(card.phase)?.push(card);
    return map;
  }, [filtered]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const id = result.draggableId;
    const phase = result.destination.droppableId as Phase;
    if (result.source.droppableId === phase) return;
    moveMut.mutate({ id, phase });
  };

  const activeCard = openCardId ? filtered.find((c) => c.id === openCardId) ?? null : null;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card/30 px-6 py-3">
        <CLFilterChip
          label="Company"
          count={filters.companies.length}
          options={COMPANIES}
          selected={filters.companies}
          onChange={(companies) => setFilters(filterKey, { companies })}
        />
        <CLFilterChip
          label="Phase"
          count={filters.phases.length}
          options={[...PHASES]}
          selected={filters.phases}
          onChange={(phases) => setFilters(filterKey, { phases: phases as Phase[] })}
        />
        <CLFilterChip
          label="Sub-indication"
          count={filters.subIndications.length}
          options={subIndications}
          selected={filters.subIndications}
          onChange={(subIndications) => setFilters(filterKey, { subIndications })}
        />
        <Select
          value={filters.priority ?? "any"}
          onValueChange={(v) => setFilters(filterKey, { priority: v === "any" ? undefined : (v as Priority) })}
        >
          <SelectTrigger className="h-8 w-32 rounded-full text-xs">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any priority</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        {(filters.companies.length || filters.phases.length || filters.subIndications.length || filters.priority) ? (
          <button
            type="button"
            onClick={() => setFilters(filterKey, { companies: [], phases: [], subIndications: [], priority: undefined })}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        ) : null}

        <div className="ml-auto flex items-center gap-3">
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Switch id="edit-mode" checked={editMode} onCheckedChange={setEditMode} />
              <Label htmlFor="edit-mode" className="cursor-pointer text-xs font-medium">
                <Pencil className="mr-1 inline h-3 w-3" />
                Edit mode
              </Label>
            </div>
          )}
          {isAdmin && (
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Add card
            </Button>
          )}
        </div>
      </div>

      {/* Board */}
      <div className="min-h-0 flex-1 overflow-x-auto bg-background p-4">
        {cardsQuery.isLoading ? (
          <KanbanSkeleton />
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-full min-w-max gap-3">
              {PHASES.map((phase) => {
                const items = grouped.get(phase) ?? [];
                return (
                  <Droppable key={phase} droppableId={phase} isDropDisabled={!editMode}>
                    {(prov, snap) => (
                      <div
                        className={cn(
                          "flex w-72 shrink-0 flex-col rounded-xl border border-border bg-card/40 p-2 transition-colors",
                          snap.isDraggingOver && "border-primary bg-primary-muted/40",
                        )}
                      >
                        <div className="flex items-center justify-between px-2 py-1.5">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {phase}
                          </h3>
                          <span className="font-mono text-xs text-muted-foreground">{items.length}</span>
                        </div>
                        <div
                          ref={prov.innerRef}
                          {...prov.droppableProps}
                          className="flex min-h-12 flex-1 flex-col gap-2"
                        >
                          {items.map((card, index) => (
                            <Draggable
                              key={card.id}
                              draggableId={card.id}
                              index={index}
                              isDragDisabled={!editMode}
                            >
                              {(p, s) => (
                                <div
                                  ref={p.innerRef}
                                  {...p.draggableProps}
                                  {...p.dragHandleProps}
                                  onClick={() => setOpenCardId(card.id)}
                                  className={cn(
                                    "cursor-pointer rounded-lg border border-border bg-card p-3 shadow-elegant transition-all hover:-translate-y-0.5 hover:shadow-card-hover",
                                    s.isDragging && "rotate-1 ring-2 ring-primary",
                                  )}
                                >
                                  <CLCardContent card={card} />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {prov.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
          </DragDropContext>
        )}
      </div>

      <CLCardModal
        card={activeCard}
        open={!!activeCard}
        onClose={() => setOpenCardId(null)}
        canEdit={isAdmin}
        onSave={(patch) => activeCard && updateMut.mutate({ id: activeCard.id, patch })}
      />

      <AddCLCardModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        indicationId={indicationId}
        onSubmit={(payload) => createMut.mutate(payload)}
        submitting={createMut.isPending}
      />
    </div>
  );
}

function CLCardContent({ card }: { card: CompetitiveLandscapeCard }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-mono text-sm font-semibold text-foreground">{card.competitor_asset}</h4>
        <PriorityBadge priority={card.priority} />
      </div>
      <p className="mt-0.5 text-xs font-medium text-foreground/80">{card.company}</p>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{card.moa} · {card.roa}</p>
      <div className="mt-2 inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        {card.sub_indication}
      </div>
    </div>
  );
}

function KanbanSkeleton() {
  return (
    <div className="flex h-full min-w-max gap-3">
      {PHASES.map((p) => (
        <div key={p} className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-card/40 p-2">
          <Skeleton className="m-2 h-4 w-24" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface CLFilterChipProps {
  label: string;
  count: number;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}

function CLFilterChip({ label, count, options, selected, onChange }: CLFilterChipProps) {
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium transition-colors hover:bg-accent",
            count > 0 && "border-primary bg-primary-muted text-primary",
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
      <PopoverContent align="start" className="w-56">
        <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
          {options.map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <Checkbox id={`${label}-${opt}`} checked={selected.includes(opt)} onCheckedChange={() => toggle(opt)} />
              <Label htmlFor={`${label}-${opt}`} className="cursor-pointer text-sm font-normal">
                {opt}
              </Label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
