import { createFileRoute } from "@tanstack/react-router";
import {
  AdminStudioHub,
  type AdminStudioSearch,
} from "@/components/admin/studio/AdminStudioHub";
import type { HeroGender } from "@/lib/platform/hero-goal-images";

function normalizeStudioSearch(search: Record<string, unknown>): AdminStudioSearch {
  const tab = search.tab === "design" ? "design" : "hero";
  const mode = search.mode === "grid" ? "grid" : "single";
  const gender: HeroGender = search.gender === "female" ? "female" : "male";
  const goal = typeof search.goal === "string" ? search.goal : undefined;
  const asset = Number.isFinite(Number(search.asset)) ? Number(search.asset) : undefined;

  return { tab, mode, gender, goal, asset };
}

export const Route = createFileRoute("/admin/studio")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): AdminStudioSearch => normalizeStudioSearch(search),
  head: () => ({ meta: [{ title: "ستوديو | مركز التشغيل" }] }),
  component: AdminStudioRoute,
});

function AdminStudioRoute() {
  const search = Route.useSearch();
  return <AdminStudioHub search={search} />;
}
