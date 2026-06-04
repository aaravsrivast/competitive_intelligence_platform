import type { LoginRequest, LoginResponse, AuthUser } from "@/types/auth";
import { ApiError, mockDelay } from "./client";

/**
 * Mock auth. Email determines role:
 *  - super@demo.io       → superadmin
 *  - admin@demo.io       → tenant admin
 *  - anything else       → user
 * Any non-empty password works.
 */
export async function login(req: LoginRequest): Promise<LoginResponse> {
  if (!req.email || !req.password) {
    throw new ApiError(400, "Email and password required");
  }

  const lower = req.email.toLowerCase().trim();
  let user: AuthUser;

  if (lower === "super@demo.io") {
    user = {
      id: "u-super",
      email: lower,
      name: "Super Admin",
      role: "superadmin",
    };
  } else if (lower === "admin@demo.io") {
    user = {
      id: "u-admin",
      email: lower,
      name: "Tenant Admin",
      role: "admin",
      tenantId: "tenant-acme",
      therapeuticAreaIds: ["ta-onco", "ta-immuno", "ta-cns", "ta-cardio", "ta-rare"],
    };
  } else {
    user = {
      id: "u-user",
      email: lower,
      name: lower.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      role: "user",
      tenantId: "tenant-acme",
      therapeuticAreaIds: ["ta-onco", "ta-immuno", "ta-cns", "ta-cardio", "ta-rare"],
    };
  }

  return mockDelay({
    token: `mock.jwt.${user.id}.${Date.now()}`,
    refreshToken: `mock.refresh.${user.id}`,
    user,
  });
}
