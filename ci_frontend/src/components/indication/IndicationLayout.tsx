import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { Indication } from "@/types/domain";
import { INDICATION_TABS, canAccessTab, type IndicationTab } from "@/constants/tabs";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface IndicationLayoutProps {
  indication: Indication | undefined;
  indicationId: string;
  activeTabId: string;
  children: ReactNode;
}

export function IndicationLayout({
  indication,
  indicationId,
  activeTabId,
  children,
}: IndicationLayoutProps) {
  const { role } = useAuth();
  const visibleTabs = INDICATION_TABS.filter((t) => (role ? canAccessTab(role === "superadmin" ? "admin" : role, t.minRole) : false));

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="border-b border-border bg-card/40 px-6 pt-4">
        <Link
          to="/app/home"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3 w-3" />
          All indications
        </Link>
        <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-foreground">
          {indication ? indication.name : <Skeleton className="inline-block h-6 w-32" />}
        </h1>
        {indication && (
          <p className="text-sm text-muted-foreground">{indication.shortDescription}</p>
        )}

        <TabBar tabs={visibleTabs} indicationId={indicationId} activeTabId={activeTabId} />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

interface TabBarProps {
  tabs: readonly IndicationTab[];
  indicationId: string;
  activeTabId: string;
}

function TabBar({ tabs, indicationId, activeTabId }: TabBarProps) {
  const linkClass = (isActive: boolean) =>
    cn(
      "inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
      isActive
        ? "border-primary text-primary"
        : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
    );

  return (
    <nav className="-mb-px mt-4 flex gap-0.5 overflow-x-auto" aria-label="Indication tabs">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === activeTabId;
        const className = linkClass(isActive);
        const params = { id: indicationId };
        const inner = (
          <>
            <Icon className="h-4 w-4" />
            {tab.label}
          </>
        );
        switch (tab.id) {
          case "news":
            return (
              <Link key={tab.id} to="/app/indication/$id/news" params={params} className={className}>
                {inner}
              </Link>
            );
          case "social":
            return (
              <Link key={tab.id} to="/app/indication/$id/social" params={params} className={className}>
                {inner}
              </Link>
            );
          case "publications":
            return (
              <Link key={tab.id} to="/app/indication/$id/publications" params={params} className={className}>
                {inner}
              </Link>
            );
          case "competitive-landscape":
            return (
              <Link key={tab.id} to="/app/indication/$id/competitive-landscape" params={params} className={className}>
                {inner}
              </Link>
            );
          case "product-profiles":
            return (
              <Link key={tab.id} to="/app/indication/$id/product-profiles" params={params} className={className}>
                {inner}
              </Link>
            );
          case "clinical-trials":
            return (
              <Link key={tab.id} to="/app/indication/$id/clinical-trials" params={params} className={className}>
                {inner}
              </Link>
            );
          case "competitors":
            return (
              <Link key={tab.id} to="/app/indication/$id/competitors" params={params} className={className}>
                {inner}
              </Link>
            );
          case "timelines":
            return (
              <Link key={tab.id} to="/app/indication/$id/timelines" params={params} className={className}>
                {inner}
              </Link>
            );
          case "reports":
            return (
              <Link key={tab.id} to="/app/indication/$id/reports" params={params} className={className}>
                {inner}
              </Link>
            );
          default:
            return null;
        }
      })}
    </nav>
  );
}
