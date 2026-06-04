import { Link } from "@tanstack/react-router";
import type { Indication, TherapeuticArea } from "@/types/domain";
import { Card } from "@/components/ui/card";

interface TherapeuticAreaCardProps {
  area: TherapeuticArea;
  indications: Indication[];
}

export function TherapeuticAreaCard({ area, indications }: TherapeuticAreaCardProps) {
  return (
    <Card className="group flex flex-col gap-4 rounded-xl border-border bg-card p-5 shadow-elegant transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold tracking-tight text-card-foreground">{area.name}</h3>
          <span className="font-mono text-xs text-muted-foreground">{indications.length}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{area.description}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {indications.map((ind) => (
          <Link
            key={ind.id}
            to="/app/indication/$id/news"
            params={{ id: ind.id }}
            className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary hover:bg-primary-muted hover:text-primary"
          >
            {ind.name}
          </Link>
        ))}
      </div>
    </Card>
  );
}
