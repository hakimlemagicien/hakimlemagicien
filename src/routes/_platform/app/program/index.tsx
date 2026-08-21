import { createFileRoute } from "@tanstack/react-router";
import { YourDayPage, type YourDaySearch } from "@/components/platform/your-day/YourDayPage";

export const Route = createFileRoute("/_platform/app/program/")({
  head: () => ({ meta: [{ title: "يومك | MAAKFIT" }] }),
  validateSearch: (search: Record<string, unknown>): YourDaySearch => ({
    from: search.from === "start-day" ? "start-day" : undefined,
  }),
  component: ProgramDayRoute,
});

function ProgramDayRoute() {
  const search = Route.useSearch();
  return <YourDayPage search={search} />;
}
