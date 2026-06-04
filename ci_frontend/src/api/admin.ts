import type { ManagedUser, Tenant } from "@/types/domain";
import { apiFetch, apiFetchPaginated } from "./client";
import { isNewEntityId, mapManagedUser, mapTenant, slugify, tenantToSettings } from "./mappers";

export async function listTenants(): Promise<Tenant[]> {
  const docs = await apiFetchPaginated<Record<string, unknown>>("/superadmin/tenants", { limit: 200 });
  return docs.map(mapTenant);
}

export async function upsertTenant(
  input: Omit<Tenant, "createdAt" | "adminCount"> & { adminCount?: number },
): Promise<Tenant> {
  const settings = tenantToSettings(input as Tenant);
  if (isNewEntityId(input.id)) {
    const doc = await apiFetch<Record<string, unknown>>("/superadmin/tenants", {
      method: "POST",
      body: { name: input.name, slug: slugify(input.name), settings },
    });
    return mapTenant(doc);
  }
  const doc = await apiFetch<Record<string, unknown>>(`/superadmin/tenants/${input.id}`, {
    method: "PATCH",
    body: { name: input.name, settings },
  });
  return mapTenant(doc);
}

export async function deleteTenant(id: string): Promise<void> {
  await apiFetch(`/superadmin/tenants/${id}`, { method: "DELETE" });
}

export async function listUsers(tenantId: string): Promise<ManagedUser[]> {
  const docs = await apiFetchPaginated<Record<string, unknown>>("/users", { limit: 200 });
  return docs.map((d) => mapManagedUser(d, tenantId));
}

export type UpsertUserInput = ManagedUser & { password?: string };

export async function upsertUser(u: UpsertUserInput): Promise<ManagedUser> {
  const [firstName, ...rest] = u.name.trim().split(/\s+/);
  const lastName = rest.join(" ") || undefined;

  if (isNewEntityId(u.id)) {
    if (!u.password || u.password.length < 8) {
      throw new Error("Password must be at least 8 characters for new users");
    }
    const doc = await apiFetch<Record<string, unknown>>("/users", {
      method: "POST",
      body: {
        email: u.email,
        password: u.password,
        role: u.role,
        first_name: firstName,
        last_name: lastName,
        therapeutic_area_ids: u.therapeuticAreaIds,
      },
    });
    return mapManagedUser(doc, u.tenantId);
  }

  await apiFetch(`/users/${u.id}`, {
    method: "PATCH",
    body: {
      first_name: firstName,
      last_name: lastName,
      active: u.active,
    },
  });

  await apiFetch(`/users/${u.id}/therapeutic-areas`, {
    method: "POST",
    body: { therapeutic_area_ids: u.therapeuticAreaIds },
  });

  const before = (await apiFetchPaginated<Record<string, unknown>>("/users", { limit: 200 })).find(
    (x) => String(x.id) === u.id,
  );
  if (before && before.role !== u.role) {
    await apiFetch(`/users/${u.id}/role`, {
      method: "POST",
      body: { role: u.role },
    });
  }

  const doc = (await apiFetchPaginated<Record<string, unknown>>("/users", { limit: 200 })).find(
    (x) => String(x.id) === u.id,
  ) ?? {
    id: u.id,
    email: u.email,
    role: u.role,
    tenant_id: u.tenantId,
    first_name: firstName,
    last_name: lastName,
    therapeutic_area_ids: u.therapeuticAreaIds,
    active: u.active,
  };

  return mapManagedUser(doc, u.tenantId);
}

export async function deleteUser(id: string): Promise<void> {
  await apiFetch(`/users/${id}`, { method: "DELETE" });
}
