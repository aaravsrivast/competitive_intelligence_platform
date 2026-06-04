import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Compass, Menu, Sun, Moon, LogOut, User, Settings, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUiStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sidebar } from "./Sidebar";
import { WidgetDock } from "@/components/widgets/WidgetDock";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar
        open={sidebarOpen}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col transition-[margin] duration-200",
          sidebarOpen ? "lg:ml-64" : "lg:ml-16",
        )}
      >
        <TopBar
          onToggleSidebar={toggleSidebar}
          onOpenMobile={() => setMobileOpen(true)}
        />
        <main className="flex-1">{children}</main>
      </div>
      <WidgetDock />
    </div>
  );
}

interface TopBarProps {
  onToggleSidebar: () => void;
  onOpenMobile: () => void;
}

function TopBar({ onToggleSidebar, onOpenMobile }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md">
      <button
        type="button"
        onClick={() => {
          onToggleSidebar();
          onOpenMobile();
        }}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-4 w-4" />
      </button>

      <Link to="/app/home" className="flex items-center gap-2 lg:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Compass className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight">Compass</span>
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <ProfileMenu />
      </div>
    </header>
  );
}

function ThemeToggle() {
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function ProfileMenu() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-accent">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
            <span className="mt-1 inline-flex w-fit items-center rounded-full bg-primary-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              {role}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void navigate({ to: "/app/home" })}>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        {role === "admin" && (
          <DropdownMenuItem onClick={() => void navigate({ to: "/app/admin" })}>
            <Settings className="mr-2 h-4 w-4" />
            Admin Settings
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={toggleTheme}>
          {theme === "dark" ? (
            <>
              <Sun className="mr-2 h-4 w-4" />
              Light mode
            </>
          ) : (
            <>
              <Moon className="mr-2 h-4 w-4" />
              Dark mode
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
