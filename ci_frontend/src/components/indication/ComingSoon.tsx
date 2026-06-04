import { Construction } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex h-full items-center justify-center p-12">
      <div className="max-w-md rounded-2xl border border-dashed border-border bg-card p-10 text-center shadow-elegant">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-muted text-primary">
          <Construction className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-card-foreground">{title}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
