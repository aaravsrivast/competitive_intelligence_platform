import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/authStore";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      throw redirect({ to: "/login" });
    }
    if (user.role === "superadmin") {
      throw redirect({ to: "/superadmin/dashboard" });
    }
    throw redirect({ to: "/app/home" });
  },
});
