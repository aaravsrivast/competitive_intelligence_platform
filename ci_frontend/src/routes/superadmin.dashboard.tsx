import { useMemo, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Trash2, Search, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";
import { listTenants, upsertTenant, deleteTenant } from "@/api/admin";
import type { Tenant } from "@/types/domain";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/superadmin/dashboard")({
  beforeLoad: ({ location }) => {
    const user = useAuthStore.getState().user;
    if (!user) throw redirect({ to: "/login", search: { redirect: location.href } });
    if (user.role !== "superadmin") throw redirect({ to: "/app/home" });
  },
  component: SuperadminDashboard,
});

function SuperadminDashboard() {
  const { user, logout } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: tenants, isLoading } = useQuery({ queryKey: ["tenants"], queryFn: listTenants });

  const upsertMut = useMutation({
    mutationFn: upsertTenant,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Tenant saved");
      setEditing(null);
      setCreating(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteTenant,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Tenant deleted");
    },
  });

  const filtered = useMemo(
    () =>
      (tenants ?? []).filter((t) => t.name.toLowerCase().includes(search.toLowerCase())),
    [tenants, search],
  );

  const totals = useMemo(() => {
    const list = tenants ?? [];
    return {
      total: list.length,
      active: list.filter((t) => t.status === "active").length,
      enterprise: list.filter((t) => t.plan === "enterprise").length,
      admins: list.reduce((s, t) => s + t.adminCount, 0),
    };
  }, [tenants]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/40 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Compass Superadmin</h1>
              <p className="text-xs text-muted-foreground">{user?.name} · Global tenant management</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="mr-2 h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Total tenants" value={totals.total} />
          <StatCard label="Active" value={totals.active} />
          <StatCard label="Enterprise" value={totals.enterprise} />
          <StatCard label="Admins" value={totals.admins} />
        </div>

        <div className="mt-6 rounded-xl border border-border bg-card shadow-elegant">
          <div className="flex items-center justify-between gap-3 border-b border-border p-4">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tenants…"
                className="pl-9"
              />
            </div>
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              New tenant
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Admins</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No tenants found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer" onClick={() => setEditing(t)}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">{t.plan}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          t.status === "active"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        }
                      >
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{t.adminCount}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => deleteMut.mutate(t.id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Delete tenant"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {(editing || creating) && (
        <TenantDialog
          tenant={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={(t) => upsertMut.mutate(t)}
          saving={upsertMut.isPending}
        />
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-elegant">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

interface TenantDialogProps {
  tenant: Tenant | null;
  onClose: () => void;
  onSave: (t: Tenant) => void;
  saving: boolean;
}

function TenantDialog({ tenant, onClose, onSave, saving }: TenantDialogProps) {
  const [form, setForm] = useState<Tenant>(
    tenant ?? {
      id: `tenant-${Date.now()}`,
      name: "",
      plan: "starter",
      status: "active",
      adminCount: 1,
      createdAt: new Date().toISOString(),
    },
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{tenant ? "Edit tenant" : "New tenant"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Plan</Label>
              <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v as Tenant["plan"] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Tenant["status"] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Admin count</Label>
            <Input
              type="number"
              min={0}
              value={form.adminCount}
              onChange={(e) => setForm({ ...form, adminCount: parseInt(e.target.value, 10) || 0 })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={saving || !form.name} onClick={() => onSave(form)}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
