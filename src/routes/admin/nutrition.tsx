import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/nutrition")({
  ssr: false,
  component: Outlet,
});
