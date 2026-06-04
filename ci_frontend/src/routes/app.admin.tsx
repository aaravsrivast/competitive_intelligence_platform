import { useMemo, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Layers, ScrollText, Plus, Trash2, Search } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";
import { listUsers, upsertUser, deleteUser, type UpsertUserInput } from "@/api/admin";
import { listLogs } from "@/api/logs";
import { listTherapeuticAreas } from "@/api/therapeuticAreas";
import type { ManagedUser } from "@/types/domain";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin")({
  beforeLoad: ({ location }) => {
    const user = useAuthStore.getState().user;
    if (!user) throw redirect({ to: "/login", search: { redirect: location.href } });
    if (user.role !== "admin") throw redirect({ to: "/app/home" });
  },
  component: AdminPanel,
});

function AdminPanel() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Admin settings</h1>
        <p className="text-sm text-muted-foreground">Manage your tenant's users, therapeutic areas, and audit log.</p>
      </header>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="mr-2 h-3.5 w-3.5" />
            Users
          </TabsTrigger>
          <TabsTrigger value="areas">
            <Layers className="mr-2 h-3.5 w-3.5" />
            Therapeutic areas
          </TabsTrigger>
          <TabsTrigger value="logs">
            <ScrollText className="mr-2 h-3.5 w-3.5" />
            Activity log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <UsersTab />
        </TabsContent>
        <TabsContent value="areas" className="mt-4">
          <AreasTab />
        </TabsContent>
        <TabsContent value="logs" className="mt-4">
          <LogsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsersTab() {
  const { user } = useAuth();
  const tenantId = user && user.role === "admin" ? user.tenantId : "";
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users", tenantId],
    queryFn: () => listUsers(tenantId),
    enabled: !!tenantId,
  });

  const { data: tas } = useQuery({
    queryKey: ["therapeutic-areas"],
    queryFn: listTherapeuticAreas,
  });

  const upsertMut = useMutation({
    mutationFn: upsertUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users", tenantId] });
      toast.success("User saved");
      setEditing(null);
      setCreating(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users", tenantId] });
      toast.success("User removed");
    },
  });

  const filtered = useMemo(
    () =>
      (users ?? []).filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()),
      ),
    [users, search],
  );

  return (
    <div className="rounded-xl border border-border bg-card shadow-elegant">
      <div className="flex items-center justify-between gap-3 border-b border-border p-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            className="pl-9"
          />
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add user
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Areas</TableHead>
            <TableHead>Status</TableHead>
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
                No users found.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((u) => (
              <TableRow key={u.id} className="cursor-pointer" onClick={() => setEditing(u)}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">{u.therapeuticAreaIds.length} assigned</span>
                </TableCell>
                <TableCell>
                  <Badge variant={u.active ? "default" : "outline"} className={u.active ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : ""}>
                    {u.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => deleteMut.mutate(u.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Delete user"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {(editing || creating) && (
        <UserDialog
          user={editing}
          tenantId={tenantId}
          tas={tas ?? []}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={(u) => upsertMut.mutate(u)}
          saving={upsertMut.isPending}
        />
      )}
    </div>
  );
}

interface UserDialogProps {
  user: ManagedUser | null;
  tenantId: string;
  tas: { id: string; name: string }[];
  onClose: () => void;
  onSave: (u: UpsertUserInput) => void;
  saving: boolean;
}

function UserDialog({ user, tenantId, tas, onClose, onSave, saving }: UserDialogProps) {
  const isNew = !user;
  const [form, setForm] = useState<ManagedUser>(
    user ?? {
      id: `u-${Date.now()}`,
      tenantId,
      name: "",
      email: "",
      role: "user",
      active: true,
      therapeuticAreaIds: [],
    },
  );
  const [password, setPassword] = useState("");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? "Edit user" : "Add user"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Email</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          {isNew && (
            <div>
              <Label className="text-xs">Password (min 8 characters)</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          )}
          <div>
            <Label className="text-xs">Role</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as "user" | "admin" })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label className="text-sm">Active</Label>
            <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
          </div>
          <div>
            <Label className="text-xs">Therapeutic areas</Label>
            <div className="mt-1.5 grid grid-cols-2 gap-2 rounded-lg border border-border p-3">
              {tas.map((ta) => {
                const checked = form.therapeuticAreaIds.includes(ta.id);
                return (
                  <label key={ta.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) =>
                        setForm({
                          ...form,
                          therapeuticAreaIds: v
                            ? [...form.therapeuticAreaIds, ta.id]
                            : form.therapeuticAreaIds.filter((x) => x !== ta.id),
                        })
                      }
                    />
                    {ta.name}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={saving || !form.name || !form.email || (isNew && password.length < 8)}
            onClick={() => onSave({ ...form, ...(isNew ? { password } : {}) })}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AreasTab() {
  const { data: tas, isLoading } = useQuery({
    queryKey: ["therapeutic-areas"],
    queryFn: listTherapeuticAreas,
  });

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-elegant">
      <p className="mb-3 text-sm text-muted-foreground">
        Therapeutic areas available for this tenant. Assign them to users from the Users tab.
      </p>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {tas?.map((ta) => (
            <div
              key={ta.id}
              className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-3"
            >
              <div>
                <p className="text-sm font-medium">{ta.name}</p>
                <p className="text-xs text-muted-foreground">{ta.description}</p>
              </div>
              <Badge variant="secondary">{ta.indicationIds.length} indications</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LogsTab() {
  const { data: logs, isLoading } = useQuery({ queryKey: ["logs"], queryFn: listLogs });
  const [filter, setFilter] = useState("");
  const filtered = useMemo(
    () =>
      (logs ?? []).filter(
        (l) =>
          l.user.toLowerCase().includes(filter.toLowerCase()) ||
          l.action.toLowerCase().includes(filter.toLowerCase()) ||
          l.tab.toLowerCase().includes(filter.toLowerCase()),
      ),
    [logs, filter],
  );

  return (
    <div className="rounded-xl border border-border bg-card shadow-elegant">
      <div className="border-b border-border p-4">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by user, tab, or action…"
          className="max-w-sm"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Tab</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4}>
                <Skeleton className="h-10 w-full" />
              </TableCell>
            </TableRow>
          ) : (
            filtered.slice(0, 50).map((l) => (
              <TableRow key={l.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(l.timestamp).toLocaleString()}
                </TableCell>
                <TableCell className="text-sm">{l.user}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{l.tab}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{l.action}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
