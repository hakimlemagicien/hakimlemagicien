import { createFileRoute } from "@tanstack/react-router";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { getLegalDocument } from "@/lib/legal/policy-content";
import { parseLegalSearch } from "@/lib/legal/legal-search";

export const Route = createFileRoute("/privacy")({
  validateSearch: parseLegalSearch,
  component: PrivacyPage,
});

function PrivacyPage() {
  const { lang } = Route.useSearch();
  const doc = getLegalDocument("privacy", lang);
  return (
    <LegalPageShell
      kind="privacy"
      locale={lang}
      title={doc.title}
      description={doc.description}
      sections={doc.sections}
    />
  );
}
