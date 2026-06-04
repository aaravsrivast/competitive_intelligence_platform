import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/store/authStore";
import { login as apiLogin } from "@/api/auth";
import type { LoginRequest, AuthUser, UserRole } from "@/types/auth";

export interface UseAuth {
  user: AuthUser | null;
  role: UserRole | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  login: (req: LoginRequest) => Promise<AuthUser>;
  logout: () => void;
}

export function useAuth(): UseAuth {
  const navigate = useNavigate();
  const { user, setAuth, clearAuth } = useAuthStore();

  return {
    user,
    role: user?.role ?? null,
    tenantId: user && user.role !== "superadmin" ? user.tenantId : null,
    isAuthenticated: !!user,
    login: async (req) => {
      const res = await apiLogin(req);
      setAuth(res);
      return res.user;
    },
    logout: () => {
      clearAuth();
      void navigate({ to: "/login" });
    },
  };
}
