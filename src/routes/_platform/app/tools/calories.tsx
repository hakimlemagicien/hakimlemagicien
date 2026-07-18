import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useToolsOptional } from "@/components/platform/tools/ToolsContext";

export const Route = createFileRoute("/_platform/app/tools/calories")({
  head: () => ({ meta: [{ title: "حاسبة السعرات | Hakim Platform" }] }),
  component: CalorieCalculatorDeepLink,
});

/** Deep link: opens the global bottom sheet instead of a standalone form page. */
function CalorieCalculatorDeepLink() {
  const navigate = useNavigate();
  const tools = useToolsOptional();

  useEffect(() => {
    tools?.openCalorieCalculator();
    void navigate({ to: "/app", replace: true });
  }, [navigate, tools]);

  return null;
}
