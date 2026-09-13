import { createFileRoute } from "@tanstack/react-router";
import { ProgramTemplateCard } from "@/components/admin/programs/ProgramTemplateCard";
import {
  ProgramTemplateDetailPanel,
  TemplateStructurePreview,
} from "@/components/admin/programs/ProgramTemplateDetailPanel";
import { TemplateRecommendationDemoStates } from "@/components/admin/programs/TemplateRecommendationDemoStates";
import { presentProgramTemplate } from "@/lib/admin/admin-template-ui";
import { createEmptyTemplateContract } from "@/lib/platform/training-templates";
import type { AdminProgramDetail } from "@/lib/admin/admin-programs-api";

export const Route = createFileRoute("/dev/template-phase4-ui")({
  component: TemplatePhase4UiDemoPage,
});

/**
 * LOCAL visual evidence route for Phase 4 Admin Template UI.
 * Not linked from production navigation. Renders the same components as Admin.
 */
function TemplatePhase4UiDemoPage() {
  const contract = createEmptyTemplateContract({
    primaryStrategy: "MUSCLE_GAIN",
    level: "BEGINNER",
    environment: "HOME",
    daysPerWeek: 3,
    targetAudience: "مبتدئون يريدون بناء عضلات من المنزل بثلاثة أيام أسبوعياً",
    templatePurpose: "أساس بناء عضلات منزلي منظم مع إحماء ومقاومة رئيسية",
  });
  contract.library_readiness = {
    state: "READY",
    missing_exercise_count: 0,
    missing_media_count: 0,
  };
  contract.admin_summary = "قالب تجريبي Phase 4 — معاينة بصرية فقط";

  const detail: AdminProgramDetail = {
    id: "demo-detail",
    slug: "MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D",
    name_ar: "أساس بناء العضلات — مبتدئ منزل 3 أيام",
    name_en: "Muscle Gain Foundation Beginner HOME 3D",
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
    description_ar: "وصف تجريبي",
    versioning_complete: true,
    session_minutes: 45,
    equipment: "dumbbells, bands",
    metadata: { template_contract: contract, training_location: "HOME" },
    weeks: [
      {
        week_number: 1,
        title_ar: "الأسبوع 1",
        notes_ar: null,
        days: [
          {
            day_number: 1,
            day_type: "workout",
            title_ar: "يوم علوي",
            muscle_focus: "upper",
            estimated_minutes: 45,
            estimated_calories: null,
            exercises: [
              {
                exercise_id: "ex1",
                sort_order: 1,
                sets: 3,
                reps_min: 10,
                reps_max: 12,
                reps_label: "10-12",
                rest_seconds: 60,
                suggested_weight_kg: null,
                notes_ar: null,
                exercise_name_ar: "ضغط صدر دمبل",
                role: "warmup",
              },
              {
                exercise_id: "ex2",
                sort_order: 2,
                sets: 4,
                reps_min: 8,
                reps_max: 10,
                reps_label: "8-10",
                rest_seconds: 90,
                suggested_weight_kg: null,
                notes_ar: null,
                exercise_name_ar: "صف دمبل",
                role: "main",
              },
            ],
          },
          {
            day_number: 2,
            day_type: "rest",
            title_ar: "راحة",
            muscle_focus: null,
            estimated_minutes: null,
            estimated_calories: null,
            exercises: [],
          },
          {
            day_number: 3,
            day_type: "workout",
            title_ar: "يوم سفلي",
            muscle_focus: "lower",
            estimated_minutes: 40,
            estimated_calories: null,
            exercises: [
              {
                exercise_id: "ex3",
                sort_order: 1,
                sets: 3,
                reps_min: 10,
                reps_max: 12,
                reps_label: "10-12",
                rest_seconds: 90,
                suggested_weight_kg: null,
                notes_ar: null,
                exercise_name_ar: "سكوات كأس",
                role: "main",
              },
            ],
          },
        ],
      },
    ],
  };

  const presentation = presentProgramTemplate(detail);

  return (
    <main className="tpl-phase4-demo" dir="rtl" lang="ar" style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1>Phase 4 — Admin Template UI (LOCAL visual evidence)</h1>
      <p className="cc-muted">نفس مكوّنات الإدارة الحقيقية · بدون تعيين · بدون استيراد قوالب</p>

      <section aria-label="مكتبة القوالب" style={{ marginTop: 24 }}>
        <h2>1. بطاقة القالب في المكتبة</h2>
        <div className="tpl-card-grid">
          <ProgramTemplateCard
            row={detail}
            presentation={presentation}
            onOpen={() => undefined}
            onPreview={() => undefined}
            onClone={() => undefined}
            onNewVersion={() => undefined}
          />
        </div>
      </section>

      <section aria-label="تفاصيل القالب" style={{ marginTop: 32 }}>
        <h2>2. تفاصيل القالب</h2>
        <ProgramTemplateDetailPanel detail={detail} />
      </section>

      <section aria-label="معاينة الهيكل" style={{ marginTop: 32 }}>
        <h2>3. معاينة الهيكل (قراءة فقط)</h2>
        <TemplateStructurePreview detail={detail} />
      </section>

      <section aria-label="حالات التوصية" style={{ marginTop: 32 }}>
        <h2>4. لوحة التوصية — حالات A–F</h2>
        <TemplateRecommendationDemoStates />
      </section>
    </main>
  );
}
