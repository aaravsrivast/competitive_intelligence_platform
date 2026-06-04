export type UserRole = "user" | "admin" | "superadmin";

export interface BaseUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
}

export interface TenantUser extends BaseUser {
  role: "user" | "admin";
  tenantId: string;
  therapeuticAreaIds: string[];
}

export interface SuperAdminUser extends BaseUser {
  role: "superadmin";
}

export type AuthUser = TenantUser | SuperAdminUser;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: AuthUser;
}
