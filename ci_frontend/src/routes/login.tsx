import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Compass } from "lucide-react";

export const Route = createFileRoute("/login")({
  beforeLoad: ({ search }) => {
    const user = useAuthStore.getState().user;
    if (user) {
      const r = (search as { redirect?: unknown }).redirect;
      throw redirect({
        to: user.role === "superadmin"
          ? "/superadmin/dashboard"
          : (typeof r === "string" && r ? r : "/app/home"),
      });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const doLogin = async (em: string, pw: string) => {
    setLoading(true);
    try {
      const user = await login({ email: em, password: pw });
      toast.success(`Welcome back, ${user.name}`);
      void navigate({ to: user.role === "superadmin" ? "/superadmin/dashboard" : "/app/home" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void doLogin(email, password);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary-muted/40 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-elegant">
            <Compass className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Compass</h1>
            <p className="mt-1 text-sm text-muted-foreground">Competitive Intelligence Platform</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-elegant">
          <h2 className="text-lg font-semibold text-card-foreground">Sign in to your workspace</h2>
          <p className="mt-1 text-sm text-muted-foreground">Enter your credentials to continue.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => toast.info("Password reset is not enabled in this demo.")}
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Use credentials provisioned in your tenant. API:{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
              {import.meta.env.VITE_API_BASE_URL || "VITE_API_BASE_URL not set"}
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
