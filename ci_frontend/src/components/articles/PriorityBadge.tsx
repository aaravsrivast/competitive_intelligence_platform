import type { Priority } from "@/types/domain";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

const STYLES: Record<Priority, string> = {
  high: "bg-destructive/10 text-destructive ring-destructive/20",
  medium: "bg-warning/15 text-warning-foreground ring-warning/30 dark:text-warning",
  low: "bg-muted text-muted-foreground ring-border",
};

const LABELS: Record<Priority, string> = {
  high: "High",
  medium: "Med",
  low: "Low",
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        STYLES[priority],
        className,
      )}
    >
      {LABELS[priority]}
    </span>
  );
}
