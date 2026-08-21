import { createFileRoute } from "@tanstack/react-router";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { getLegalDocument } from "@/lib/legal/policy-content";
import { parseLegalSearch } from "@/lib/legal/legal-search";

export const Route = createFileRoute("/terms")({
  validateSearch: parseLegalSearch,
  component: TermsPage,
});

function TermsPage() {
  const { lang } = Route.useSearch();
  const doc = getLegalDocument("terms", lang);
  return (
    <LegalPageShell
      kind="terms"
      locale={lang}
      title={doc.title}
      description={doc.description}
      sections={doc.sections}
    />
  );
}
