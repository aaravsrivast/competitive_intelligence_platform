import type { LoginRequest, LoginResponse } from "@/types/auth";
import { apiFetch } from "./client";
import { mapProfileToAuthUser, mapSuperadminUser } from "./mappers";

type TokenPayload = {
  access_token: string;
  refresh_token: string;
  redirect_hint: string;
  role: string;
  tenant_id: string | null;
  user_id: string;
};

export async function login(req: LoginRequest): Promise<LoginResponse> {
  if (!req.email?.trim() || !req.password) {
    throw new Error("Email and password required");
  }

  const data = await apiFetch<TokenPayload>("/auth/login", {
    method: "POST",
    body: { email: req.email.trim(), password: req.password },
    auth: false,
  });

  let user;
  if (data.role === "superadmin") {
    user = mapSuperadminUser(data.user_id, req.email.trim());
  } else {
    const profile = await apiFetch<Record<string, unknown>>("/profile", {
      auth: false,
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    user = mapProfileToAuthUser(profile, req.email.trim());
  }

  return {
    token: data.access_token,
    refreshToken: data.refresh_token,
    user,
  };
}
