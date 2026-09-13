import type { TemplatePresentation } from "@/lib/admin/admin-template-ui";

export function ProgramTemplateBadges({
  presentation,
  showReadiness = true,
}: {
  presentation: TemplatePresentation;
  showReadiness?: boolean;
}) {
  return (
    <div className="tpl-badges" aria-label="تصنيفات القالب">
      <span className="tpl-badge tpl-badge--goal">{presentation.primary_strategy_label}</span>
      <span className="tpl-badge tpl-badge--level">{presentation.level_label}</span>
      <span className="tpl-badge tpl-badge--env">{presentation.environment_label}</span>
      <span className="tpl-badge tpl-badge--days">{presentation.days_label}</span>
      {presentation.is_legacy ? <span className="tpl-badge tpl-badge--legacy">قالب قديم</span> : null}
      {showReadiness ? (
        <span className="tpl-badge tpl-badge--ready">{presentation.library_readiness_label}</span>
      ) : null}
    </div>
  );
}
