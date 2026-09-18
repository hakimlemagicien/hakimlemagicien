import { createFileRoute } from "@tanstack/react-router";
import { NutritionTemplateCatalog } from "@/components/admin/NutritionTemplateCatalog";

export const Route = createFileRoute("/admin/nutrition/templates")({
  ssr: false,
  head: () => ({ meta: [{ title: "قوالب التغذية | مركز التشغيل" }] }),
  component: NutritionTemplateCatalog,
});
