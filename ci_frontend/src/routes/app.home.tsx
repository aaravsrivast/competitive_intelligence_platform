import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { listTherapeuticAreas, listIndications } from "@/api/therapeuticAreas";
import { Input } from "@/components/ui/input";
import { TherapeuticAreaCard } from "@/components/home/TherapeuticAreaCard";
import { TherapeuticAreaCardSkeleton } from "@/components/home/TherapeuticAreaCardSkeleton";

export const Route = createFileRoute("/app/home")({
  component: HomePage,
});

function HomePage() {
  const [search, setSearch] = useState("");

  const tasQuery = useQuery({
    queryKey: ["therapeuticAreas"],
    queryFn: listTherapeuticAreas,
  });
  const indQuery = useQuery({
    queryKey: ["indications"],
    queryFn: listIndications,
  });

  const filtered = useMemo(() => {
    const tas = tasQuery.data ?? [];
    const inds = indQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return { tas, inds };
    const matchingTas = tas.filter(
      (ta) =>
        ta.name.toLowerCase().includes(q) ||
        ta.description.toLowerCase().includes(q) ||
        inds.some(
          (i) => i.therapeuticAreaId === ta.id && i.name.toLowerCase().includes(q),
        ),
    );
    return { tas: matchingTas, inds };
  }, [tasQuery.data, indQuery.data, search]);

  const isLoading = tasQuery.isLoading || indQuery.isLoading;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Therapeutic Areas</h1>
        <p className="text-sm text-muted-foreground">
          Select an indication to explore competitive intelligence.
        </p>
      </div>

      <div className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search areas or indications..."
          className="pl-9"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <TherapeuticAreaCardSkeleton key={i} />)
          : filtered.tas.map((ta) => (
              <TherapeuticAreaCard
                key={ta.id}
                area={ta}
                indications={filtered.inds.filter((i) => i.therapeuticAreaId === ta.id)}
              />
            ))}

        {!isLoading && filtered.tas.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center">
            <p className="text-sm text-muted-foreground">
              No therapeutic areas match <span className="font-medium">"{search}"</span>.
            </p>
          </div>
        )}
      </div>

      <div className="mt-12 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-xs text-muted-foreground">
        Phase 1 build — News tab is fully wired.{" "}
        <Link to="/app/indication/$id/news" params={{ id: "ind-nsclc" }} className="font-medium text-primary hover:underline">
          Jump to NSCLC News →
        </Link>
      </div>
    </div>
  );
}
