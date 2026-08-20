import { createFileRoute } from "@tanstack/react-router";
import { NutritionLibraryManager } from "@/components/admin/libraries/NutritionLibraryManager";

export const Route = createFileRoute("/admin/nutrition")({
  ssr: false,
  head: () => ({ meta: [{ title: "التغذية | مركز التشغيل" }] }),
  component: NutritionLibraryManager,
});
