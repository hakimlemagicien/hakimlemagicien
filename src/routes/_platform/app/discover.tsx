import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_platform/app/discover")({
  component: DiscoverLayout,
});

function DiscoverLayout() {
  return <Outlet />;
}
