import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/indication/$id")({
  beforeLoad: ({ params, location }) => {
    // Only redirect when landing exactly on /app/indication/:id (no child tab selected).
    // Without this guard, navigating to a child like /news re-triggers the parent
    // beforeLoad and creates an infinite redirect loop.
    if (location.pathname.replace(/\/$/, "") === `/app/indication/${params.id}`) {
      throw redirect({ to: "/app/indication/$id/news", params: { id: params.id } });
    }
  },
  component: () => <Outlet />,
});
