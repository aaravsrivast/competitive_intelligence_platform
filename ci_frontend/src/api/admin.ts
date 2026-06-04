import type { ManagedUser, Tenant } from "@/types/domain";
import { MOCK_TENANTS, MOCK_USERS } from "@/lib/mockData";
import { mockDelay } from "./client";

let tenants: Tenant[] = [...MOCK_TENANTS];
let users: ManagedUser[] = [...MOCK_USERS];

export async function listTenants(): Promise<Tenant[]> {
  return mockDelay(tenants);
}

export async function upsertTenant(input: Omit<Tenant, "createdAt" | "adminCount"> & { adminCount?: number }): Promise<Tenant> {
  const existing = tenants.find((t) => t.id === input.id);
  if (existing) {
    const updated = { ...existing, ...input, adminCount: input.adminCount ?? existing.adminCount };
    tenants = tenants.map((t) => (t.id === input.id ? updated : t));
    return mockDelay(updated, 100);
  }
  const created: Tenant = { ...input, adminCount: input.adminCount ?? 1, createdAt: new Date().toISOString() };
  tenants = [created, ...tenants];
  return mockDelay(created, 100);
}

export async function deleteTenant(id: string): Promise<void> {
  tenants = tenants.filter((t) => t.id !== id);
  return mockDelay(undefined, 50);
}

export async function listUsers(tenantId: string): Promise<ManagedUser[]> {
  return mockDelay(users.filter((u) => u.tenantId === tenantId));
}

export async function upsertUser(u: ManagedUser): Promise<ManagedUser> {
  const exists = users.find((x) => x.id === u.id);
  if (exists) {
    users = users.map((x) => (x.id === u.id ? u : x));
  } else {
    users = [u, ...users];
  }
  return mockDelay(u, 100);
}

export async function deleteUser(id: string): Promise<void> {
  users = users.filter((u) => u.id !== id);
  return mockDelay(undefined, 50);
}
