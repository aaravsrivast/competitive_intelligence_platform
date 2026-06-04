import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TherapeuticAreaCardSkeleton() {
  return (
    <Card className="flex flex-col gap-4 rounded-xl border-border bg-card p-5 shadow-elegant">
      <div>
        <Skeleton className="h-5 w-28" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
    </Card>
  );
}
