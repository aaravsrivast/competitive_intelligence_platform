import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { useAuthStore } from "@/store/authStore";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/app")({
  beforeLoad: ({ location }) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    if (user.role === "superadmin") {
      throw redirect({ to: "/superadmin/dashboard" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
