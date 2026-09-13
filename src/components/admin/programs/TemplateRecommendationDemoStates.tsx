import { useMemo, useState } from "react";
import { TemplateRecommendationPanel } from "@/components/admin/programs/TemplateRecommendationPanel";
import {
  presentProgramTemplate,
  runDemoRecommendationScenario,
  type DemoRecommendationScenario,
} from "@/lib/admin/admin-template-ui";
import { ProgramTemplateCard } from "@/components/admin/programs/ProgramTemplateCard";
import { createEmptyTemplateContract } from "@/lib/platform/training-templates";

const SCENARIOS: Array<{ id: DemoRecommendationScenario; label: string }> = [
  { id: "exact_match", label: "A · تطابق تام" },
  { id: "no_exact_match", label: "B · لا تطابق تام" },
  { id: "review_required", label: "C · مراجعة مطلوبة" },
  { id: "insufficient_context", label: "D · سياق غير كافٍ" },
  { id: "coach_override", label: "E · تجاوز المدرب" },
  { id: "legacy_template", label: "F · قالب قديم" },
];

/**
 * Dev/QA surface for Phase 4 visual states (fixture-backed).
 * Does not assign programs.
 */
export function TemplateRecommendationDemoStates() {
  const [scenario, setScenario] = useState<DemoRecommendationScenario>("exact_match");
  const demo = useMemo(() => runDemoRecommendationScenario(scenario), [scenario]);

  const legacyPresentation = presentProgramTemplate({
    name_ar: "برنامج تضخيم قديم (بدون عقد)",
    goal: "bulk",
    level: "beginner",
    days_per_week: 3,
    training_location: "HOME",
    version: 1,
    is_published: true,
    archived_at: null,
    metadata: {},
  });

  const contractPresentation = presentProgramTemplate({
    name_ar: "Muscle Gain Foundation Beginner HOME 3D",
    goal: "bulk",
    level: "beginner",
    days_per_week: 3,
    training_location: "HOME",
    version: 2,
    is_published: true,
    archived_at: null,
    metadata: {
      template_contract: createEmptyTemplateContract({
        primaryStrategy: "MUSCLE_GAIN",
        level: "BEGINNER",
        environment: "HOME",
        daysPerWeek: 3,
        targetAudience: "مبتدئون يريدون بناء عضلات من المنزل",
        templatePurpose: "أساس بناء عضلات 3 أيام منزل",
      }),
    },
  });

  return (
    <section className="tpl-demo" aria-label="حالات توصية القالب للمراجعة البصرية">
      <header className="tpl-demo__header">
        <h2 className="cc-section__title">مراجعة حالات التوصية (تطوير / QA)</h2>
        <p className="cc-muted">
          تعتمد على فهرس fixtures — بدون استيراد القوالب الـ 36 وبدون تعيين تلقائي.
        </p>
      </header>

      <div className="tpl-demo__tabs" role="tablist" aria-label="سيناريوهات التوصية">
        {SCENARIOS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={scenario === item.id}
            className={["cc-btn", scenario === item.id ? "cc-btn--primary" : "cc-btn--ghost"].join(" ")}
            onClick={() => setScenario(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <p className="tpl-demo__title">
        <strong>{demo.title}</strong>
      </p>

      <TemplateRecommendationPanel
        goal={demo.client.goal}
        trainingType={demo.client.trainingType}
        level={demo.client.level}
        daysPerWeek={demo.client.daysPerWeek}
        fatLossPriority={demo.client.fatLossPriority}
        coachOverride={demo.client.coachOverride}
        forcedResult={demo.result}
      />

      {scenario === "legacy_template" ? (
        <div className="tpl-demo__legacy">
          <p role="note">{demo.legacyNote}</p>
          <div className="tpl-card-grid">
            <ProgramTemplateCard
              row={{
                id: "legacy-demo",
                slug: "legacy-demo",
                name_ar: legacyPresentation.name,
                name_en: null,
                goal: "bulk",
                level: "beginner",
                duration_weeks: 8,
                days_per_week: 3,
                version: 1,
                is_published: true,
                archived_at: null,
                assignment_count: 0,
                updated_at: new Date().toISOString(),
                training_location: "HOME",
              }}
              presentation={legacyPresentation}
              onOpen={() => undefined}
              onPreview={() => undefined}
              onClone={() => undefined}
              onNewVersion={() => undefined}
            />
            <ProgramTemplateCard
              row={{
                id: "contract-demo",
                slug: "contract-demo",
                name_ar: contractPresentation.name,
                name_en: null,
                goal: "bulk",
                level: "beginner",
                duration_weeks: 8,
                days_per_week: 3,
                version: 2,
                is_published: true,
                archived_at: null,
                assignment_count: 0,
                updated_at: new Date().toISOString(),
                training_location: "HOME",
              }}
              presentation={contractPresentation}
              onOpen={() => undefined}
              onPreview={() => undefined}
              onClone={() => undefined}
              onNewVersion={() => undefined}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
