import { createFileRoute } from "@tanstack/react-router";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { getLegalDocument } from "@/lib/legal/policy-content";
import { parseLegalSearch } from "@/lib/legal/legal-search";

export const Route = createFileRoute("/refund")({
  validateSearch: parseLegalSearch,
  component: RefundPage,
});

function RefundPage() {
  const { lang } = Route.useSearch();
  const doc = getLegalDocument("refund", lang);
  return (
    <LegalPageShell
      kind="refund"
      locale={lang}
      title={doc.title}
      description={doc.description}
      sections={doc.sections}
    />
  );
}
