import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Compass, Home, X, ChevronRight } from "lucide-react";
import { listTherapeuticAreas, listIndications } from "@/api/therapeuticAreas";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ open, mobileOpen, onMobileClose }: SidebarProps) {
  const tasQuery = useQuery({ queryKey: ["therapeuticAreas"], queryFn: listTherapeuticAreas });
  const indQuery = useQuery({ queryKey: ["indications"], queryFn: listIndications });

  const collapsed = !open;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200",
          // Width
          collapsed ? "w-16" : "w-64",
          // Mobile show/hide
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-sidebar-border px-4">
          <Link to="/app/home" className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Compass className="h-4 w-4" />
            </div>
            {!collapsed && <span className="text-sm font-semibold tracking-tight">Compass</span>}
          </Link>
          <button
            type="button"
            onClick={onMobileClose}
            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <SidebarItem to="/app/home" label="Home" icon={Home} collapsed={collapsed} onClick={onMobileClose} />

          {!collapsed && (
            <div className="mt-5">
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Therapeutic Areas
              </p>
              <ul className="mt-1 space-y-3">
                {(tasQuery.data ?? []).map((ta) => {
                  const inds = (indQuery.data ?? []).filter((i) => i.therapeuticAreaId === ta.id);
                  return (
                    <li key={ta.id}>
                      <p className="px-3 pb-1 text-xs font-medium text-sidebar-foreground/80">{ta.name}</p>
                      <ul className="space-y-0.5">
                        {inds.map((ind) => (
                          <li key={ind.id}>
                            <Link
                              to="/app/indication/$id/news"
                              params={{ id: ind.id }}
                              onClick={onMobileClose}
                              className="group flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                              activeProps={{
                                className:
                                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                              }}
                            >
                              <ChevronRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                              <span className="truncate">{ind.name}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </nav>

        <div className="border-t border-sidebar-border px-3 py-2 text-[10px] text-muted-foreground">
          {!collapsed && <span>v0.1 · Phase 1</span>}
        </div>
      </aside>
    </>
  );
}

interface SidebarItemProps {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  collapsed: boolean;
  onClick?: () => void;
}

function SidebarItem({ to, label, icon: Icon, collapsed, onClick }: SidebarItemProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        collapsed && "justify-center px-0",
      )}
      activeProps={{
        className: cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium bg-sidebar-accent text-sidebar-accent-foreground",
          collapsed && "justify-center px-0",
        ),
      }}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}
